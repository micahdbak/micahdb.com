import * as tscon from "@micahdb/tscon";
import { Pos } from "./buffer.ts";
import type { Editor } from "./editor/editor.ts";
import { moveDisplay } from "./editor/normal.ts";
import type { Viewport } from "./viewport.ts";

const MAX_DRAG_VELOCITY = 2;
const MOMENTUM_DECAY = 0.95;
const MOMENTUM_STOP = 0.01;

/**
 * Mouse interaction outside the vi cursor: a click moves the vi cursor, and a
 * press-drag pans the viewport with momentum. The cursor is placed once where
 * the press began and keeps its source row while the drag scrolls the view
 * around it.
 */
export class Input {
	private readonly editor: Editor;
	private readonly canvas: tscon.Canvas;
	private readonly viewport: Viewport;
	private readonly screenToBuffer: (row: number, col: number) => Pos | null;

	private dragging = false;
	private drag: { start_row: number; start_top: number; last_row: number } | null = null;
	private row_velocity = 0;
	private row_remainder = 0;

	constructor(
		editor: Editor,
		canvas: tscon.Canvas,
		viewport: Viewport,
		screenToBuffer: (row: number, col: number) => Pos | null
	) {
		this.editor = editor;
		this.canvas = canvas;
		this.viewport = viewport;
		this.screenToBuffer = screenToBuffer;
	}

	attach(): void {
		this.canvas.addEventListener("wheel", (event: Event) => {
			const rows = (event as CustomEvent<{ rows: number }>).detail.rows;

			if (rows === 0 || this.editor.mode === "command_line") {
				return;
			}

			moveDisplay(this.editor, Math.abs(rows), rows > 0);
		});

		this.canvas.addEventListener("keydown", (event: Event) => {
			const key = (event as CustomEvent<tscon.Key>).detail;
			const token = this.token(key);

			if (token === null) {
				return;
			}

			key.prevent_default();
			event.stopImmediatePropagation();
			this.editor.key(token);
		});
	}

	// polled once per frame, before rendering
	update(): void {
		if (this.canvas.mouse_down) {
			this.stopMomentum();
			this.updatePressed();
			return;
		}

		if (this.dragging) {
			this.dragging = false;
			this.drag = null;
			this.canvas.mouse_owner = "";

			// a drag never activates a link
			this.canvas.mouse_click = false;
		}

		this.coast();
	}

	/** Whether a drag or its momentum is still moving the viewport. */
	isPanning(): boolean {
		return this.dragging || this.row_velocity !== 0;
	}

	/**
	 * Places the cursor from a plain click, called after the view has
	 * rendered: the link components must see the click while their line
	 * still renders as links -- placing the cursor first would flip the
	 * line to its raw form and swallow the click
	 */
	placeClick(): void {
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

		if (!this.dragging) {
			const moved = mouse_row !== mouse_down_row || mouse_col !== mouse_down_col;

			// a drag claims the mouse only while nothing else owns it
			if (!moved || this.canvas.mouse_owner !== "") {
				return;
			}

			this.startDrag(mouse_down_row, mouse_down_col);
		}

		const drag = this.drag;

		if (drag === null) {
			return;
		}

		const row_delta = mouse_row - drag.last_row;
		this.row_velocity = Math.max(
			-MAX_DRAG_VELOCITY,
			Math.min(MAX_DRAG_VELOCITY, row_delta)
		);
		drag.last_row = mouse_row;

		const top = drag.start_top - (mouse_row - drag.start_row);
		const content_rows = this.editor.layout.displayRows.length;

		this.viewport.scrollTo(top, content_rows, this.canvas.rows);
	}

	private startDrag(row: number, col: number): void {
		this.dragging = true;
		this.canvas.mouse_owner = "vi";
		this.drag = { start_row: row, start_top: this.viewport.top, last_row: row };

		const anchor = this.screenToBuffer(row, col);

		if (anchor !== null) {
			this.editor.placeCursor(anchor);
		}
	}

	/**
	 * Continues the drag's last velocity after release. The viewport's row is
	 * an integer, so fractional rows accumulate until they make a whole one.
	 */
	private coast(): void {
		if (this.row_velocity === 0) {
			return;
		}

		this.row_remainder += this.row_velocity;

		const rows = Math.trunc(this.row_remainder);

		if (rows !== 0) {
			this.row_remainder -= rows;

			const content_rows = this.editor.layout.displayRows.length;
			this.viewport.scrollTo(this.viewport.top - rows, content_rows, this.canvas.rows);
		}

		this.row_velocity *= MOMENTUM_DECAY;

		if (Math.abs(this.row_velocity) < MOMENTUM_STOP) {
			this.stopMomentum();
		}
	}

	private stopMomentum(): void {
		this.row_velocity = 0;
		this.row_remainder = 0;
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
	private token(event: tscon.Key): string | null {
		const key = event.key;

		if (event.ctrl && !event.alt && !event.meta) {
			const ctrl = { f: "<c-f>", b: "<c-b>", d: "<c-d>", u: "<c-u>" }[key.toLowerCase()];
			return ctrl ?? null;
		}

		if (event.meta || event.alt || event.ctrl) {
			return null;
		}

		switch (key) {
			// captured so the browser does not move focus; vi inserts it
			// as a real tab in insert and replace modes
			case "Tab":
				return "\t";

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
