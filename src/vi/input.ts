import type { Canvas } from "@micahdb/tscon";
import { Pos } from "./buffer.ts";
import { moveDisplay } from "./editor/normal.ts";
import type { Editor } from "./editor/editor.ts";

/**
 * Mouse interaction outside the vi cursor: clicks move the vi cursor, and
 * press-drag-release paints a transient selection that is fake visual mode.
 */
export class Input {
	private dragging = false;
	private anchor: Pos | null = null;

	constructor(
		private readonly editor: Editor,
		private readonly canvas: Canvas,
		private readonly screenToBuffer: (row: number, col: number) => Pos | null
	) {}

	attach(): void {
		this.canvas.addEventListener("wheel", (event: Event) => {
			const rows = (event as CustomEvent<{ rows: number }>).detail.rows;

			if (rows === 0 || this.editor.mode === "command_line") {
				return;
			}

			moveDisplay(this.editor, Math.abs(rows), rows > 0);
		});

		window.addEventListener(
			"keydown",
			(event: KeyboardEvent) => {
				const token = this.token(event);

				if (token === null) {
					return;
				}

				event.preventDefault();
				event.stopPropagation();
				this.editor.key(token);
			},
			{ capture: true }
		);
	}

	// polled once per frame, before rendering
	update(): void {
		if (!this.canvas.mouse_down) {
			this.updateReleased();
			return;
		}

		this.updatePressed();
	}

	// a released mouse places the cursor: after a drag that became a
	// selection, the highlight drops and the click is consumed so no link
	// fires
	private updateReleased(): void {
		if (this.dragging) {
			this.dragging = false;
			this.canvas.mouse_owner = "";
			this.editor.selection = null;
			this.placeFromMouse();
			this.canvas.mouse_click = false;
			return;
		}

		if (this.canvas.mouse_click) {
			this.placeFromMouse();
		}
	}

	private updatePressed(): void {
		const { mouse_row, mouse_col, mouse_down_row, mouse_down_col } = this.canvas;
		const positioned =
			mouse_row !== undefined && mouse_col !== undefined
			&& mouse_down_row !== undefined && mouse_down_col !== undefined;

		if (!positioned) {
			return;
		}

		const moved = mouse_row !== mouse_down_row || mouse_col !== mouse_down_col;

		// a drag claims the mouse only while nothing else owns it
		if (moved && !this.dragging && this.canvas.mouse_owner === "") {
			this.dragging = true;
			this.canvas.mouse_owner = "vi";
			this.anchor = this.screenToBuffer(mouse_down_row, mouse_down_col);
		}

		if (this.dragging && this.anchor !== null) {
			const head = this.screenToBuffer(mouse_row, mouse_col);

			if (head !== null) {
				this.editor.selection = { anchor: this.anchor, head };
			}
		}
	}

	private placeFromMouse(): void {
		if (this.canvas.mouse_row === undefined || this.canvas.mouse_col === undefined) {
			return;
		}

		const position = this.screenToBuffer(this.canvas.mouse_row, this.canvas.mouse_col);

		if (position !== null) {
			this.editor.placeCursor(position);
		}
	}

	// keystroke tokens: printable characters as-is, named tokens for the rest
	private token(event: KeyboardEvent): string | null {
		const key = event.key;

		if (event.ctrlKey && !event.altKey && !event.metaKey) {
			const ctrl = { f: "<c-f>", b: "<c-b>", d: "<c-d>", u: "<c-u>" }[key.toLowerCase()];
			return ctrl ?? null;
		}

		if (event.metaKey || event.altKey || event.ctrlKey) {
			return null;
		}

		switch (key) {
			case "Enter":
				return "enter";

			case "Backspace":
				return "<bs>";

			case "Escape":
				return "esc";

			case "ArrowUp":
				return "<up>";

			case "ArrowDown":
				return "<down>";

			case "ArrowLeft":
				return "<left>";

			case "ArrowRight":
				return "<right>";
		}

		return key.length === 1 ? key : null;
	}
}
