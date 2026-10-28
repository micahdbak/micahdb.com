import type { Pos } from "./buffer.ts";

export type Snapshot = { lines: string[]; cursor: Pos };

/**
 * Vi keeps exactly one undo level: u swaps the buffer between the state
 * before the last change and the state after it, so repeating u toggles
 * between the two. A new change replaces the remembered state.
 */
export class Undo {
	private state: Snapshot | null = null;
	private line_state: { line: number; snapshot: Snapshot } | null = null;

	// called before a change, with the state u should return to
	remember(snapshot: Snapshot): void {
		this.state = snapshot;
	}

	/**
	 * Remembers the state of a line before its first change since the last
	 * undo, which is what U restores.
	 */
	touchLine(line: number, snapshot: Snapshot): void {
		if (this.line_state === null || this.line_state.line !== line) {
			this.line_state = { line, snapshot };
		}
	}

	/**
	 * Hands back the remembered state; the caller's current state becomes
	 * the next remembered state, which is what makes u a toggle.
	 */
	take(current: Snapshot): Snapshot | null {
		const restored = this.state;
		this.state = current;
		this.line_state = null;
		return restored;
	}

	/**
	 * U's entry point: the line's pre-change state, once; a second U
	 * finds nothing remembered
	 */
	takeLine(): Snapshot | null {
		const restored = this.line_state?.snapshot ?? null;
		this.line_state = null;
		return restored;
	}
}
