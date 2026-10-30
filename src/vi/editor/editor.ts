import { Buffer, Pos, Range } from "../buffer.ts";
import { Cursor } from "../cursor.ts";
import { Layout } from "../layout.ts";
import type { ImageLimits } from "../layout.ts";
import type { MotionContext, CharSearch } from "../motions/types.ts";
import { feed } from "../parser.ts";
import type { Pending } from "../parser.ts";
import { Registers } from "../registers.ts";
import type { SearchState } from "../search.ts";
import { Undo } from "../undo.ts";
import type { Snapshot } from "../undo.ts";
import { commandLineKey } from "./command_line.ts";
import { insertKey } from "./insert.ts";
import { applyOperatorRange, doMotion, doOperatorCommand, doSimple } from "./normal.ts";
import type { CommandLine, Mode, Repeat, Session, ViewportState } from "./types.ts";

/**
 * The editor state machine: modes, the command parser, insert sessions,
 * registers, the single-level undo, repeat, search, and cursor handling.
 * Everything here speaks buffer coordinates; the view and input layers
 * translate to and from screen cells. Mode behavior lives in the sibling
 * modules, which receive the editor instance.
 */
export class Editor {
	// the document and the machinery built around it once
	readonly buffer: Buffer;
	readonly layout: Layout;
	readonly cursor: Cursor;
	readonly registers: Registers;
	readonly undo_state: Undo;
	readonly marks: Map<string, Pos>;
	readonly history: string[];
	readonly viewport: ViewportState;

	// the mutable editor state
	search: SearchState = { pattern: "", forward: true };
	last_char_search: CharSearch | null = null;
	last_jump: Pos | null = null;
	mode: Mode = "normal";
	pending: Pending | null = null;
	command_line: CommandLine | null = null;
	history_index: number | null = null;
	session: Session | null = null;
	repeat_last: Repeat | null = null;
	message: string | null = null;

	constructor(content: string, width: number, image_limits?: ImageLimits) {
		this.buffer = new Buffer(content);
		this.layout = new Layout(this.buffer, width, image_limits);
		this.cursor = new Cursor();
		this.registers = new Registers();
		this.undo_state = new Undo();
		this.marks = new Map();
		this.history = [];
		this.viewport = { top: 0, rows: 24 };
	}

	// one keystroke, in whatever mode is active
	key(key: string): void {
		this.message = null;

		if (this.mode === "command_line") {
			commandLineKey(this, key);
		} else if (this.mode === "insert" || this.mode === "replace") {
			insertKey(this, key);
		} else {
			this.normalKey(key);
		}

		this.clampCursor();
	}

	flash(message: string): void {
		this.message = message;
	}

	// places the cursor at a buffer position, clamped to command-mode rules
	placeCursor(position: Pos): void {
		this.cursor.setExact(position);
		this.clampCursor();
	}

	// ex-mode entry points: linewise delete / yank / put on the cursor line
	deleteRange(range: Range): void {
		applyOperatorRange(this, "d", range, "linewise");
	}

	yankRange(range: Range): void {
		applyOperatorRange(this, "y", range, "linewise");
	}

	putRange(): void {
		doSimple(this, { kind: "simple", key: "p", count: 1 });
	}

	motionContext(): MotionContext {
		return {
			buffer: this.buffer,
			layout: this.layout,
			marks: this.marks,
			last_char_search: this.last_char_search,
			last_jump: this.last_jump,
			search: this.search,
			viewport_top: this.viewport.top,
			screen_rows: this.viewport.rows,
		};
	}

	// the single snapshot u returns to; taken before every mutating command
	rememberState(): void {
		const snapshot: Snapshot = { lines: [...this.buffer.lines], cursor: this.cursor.pos };
		this.undo_state.remember(snapshot);
		this.undo_state.touchLine(this.cursor.pos.line, snapshot);
	}

	afterEdit(from_line: number): void {
		this.layout.invalidateFrom(from_line);
	}

	clampCursor(): void {
		const line = Math.max(0, Math.min(this.buffer.lineCount() - 1, this.cursor.pos.line));
		// insert mode may rest past the last character; normal mode may not
		const insert_mode = this.mode === "insert" || this.mode === "replace";
		const max_col = insert_mode ? this.buffer.lineLength(line) : this.buffer.lastCol(line).col;
		this.cursor.pos = new Pos(line, Math.min(this.cursor.pos.col, max_col));
	}

	/**
	 * U: swaps the buffer with the remembered pre-change state, so pressing
	 * it again toggles the change back (vi's single undo level)
	 */
	undo(): void {
		this.restore(
			this.undo_state.take({ lines: [...this.buffer.lines], cursor: this.cursor.pos }),
			"Already at oldest change"
		);
	}

	// U: undoes all changes made to the most recently changed line
	undoLine(): void {
		this.restore(this.undo_state.takeLine(), "Nothing to undo on this line");
	}

	private restore(restored: Snapshot | null, empty_message: string): void {
		if (restored === null) {
			this.flash(empty_message);
			return;
		}

		this.buffer.lines = [...restored.lines];
		this.buffer.modified = true;
		this.layout.invalidateFrom(0);
		this.cursor.setExact(restored.cursor);
	}

	put(behind: boolean, count: number, register?: string): void {
		const content = this.registers.read(register);

		if (content === null) {
			this.flash("E353: Nothing in register " + (register ?? ""));
			return;
		}

		this.rememberState();
		const at = this.cursor.pos;

		if (content.linewise) {
			const lines = content.text.repeat(Math.max(1, count)).replace(/\n$/, "").split("\n");
			const line = behind ? at.line : at.line + 1;

			this.buffer.lines.splice(line, 0, ...lines);
			this.buffer.modified = true;
			this.afterEdit(line);
			this.cursor.setExact(this.buffer.firstNonBlank(line));
			return;
		}

		const col = behind ? at.col : Math.min(this.buffer.lineLength(at.line), at.col + 1);
		const text = content.text.repeat(Math.max(1, count));
		const start = new Pos(at.line, col);

		this.buffer.insert(start, text);
		this.afterEdit(at.line);

		const end = start.advancedBy(text);
		this.cursor.setExact(new Pos(end.line, Math.max(0, end.col - 1)));
	}

	private normalKey(key: string): void {
		const parsed = feed(this.pending, key);
		this.pending = parsed.pending;

		if (parsed.command === null) {
			return;
		}

		switch (parsed.command.kind) {
			case "motion":
				doMotion(this, parsed.command.motion);
				break;

			case "operator":
				doOperatorCommand(this, parsed.command);
				break;

			case "simple":
				doSimple(this, parsed.command);
				break;

			case "command_line":
				this.mode = "command_line";
				this.command_line = { prompt: parsed.command.prompt, text: "" };
				this.history_index = null;
				break;

			case "invalid":
				this.pending = null;
				break;
		}
	}
}
