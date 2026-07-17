import { Terminal } from "./terminal.ts";
import { Glyphs, textGlyphs } from "./glyphs.ts";

export class Scroller {
	private static readonly NAME = "scroller"; // for mouse_owner

	private terminal: Terminal;

	private wheel_rows: number;

	private is_dragging: boolean;
	private drag_start_row: number;
	private drag_start_row_offset: number;
	private drag_last_row: number;
	private drag_velocity: number;

	private row_offset: number;

	private last_content_rows: number;
	private last_row: number;

	public row: number;

	public status_glyphs: Glyphs;

	constructor(terminal: Terminal) {
		this.terminal = terminal;

		this.wheel_rows = 0;

		this.is_dragging = false;

		this.row_offset = 0;

		this.last_row = 0;

		this.row = 0;

		this.terminal.canvas.addEventListener("wheel", (event: CustomEvent) => {
			const detail = event.detail as { rows: number };
			this.wheel_rows += detail.rows;
		});
	}

	scrollToRow(row: number, content_rows: number) {
		if (row < 0 || row >= content_rows) {
			return;
		}

		this.wheel_rows = 0;
		this.is_dragging = false;
		this.drag_velocity = 0;

		this.row_offset = row;
		this.last_row = this.row;
		this.row = row;
		this.last_content_rows = content_rows;

		if (this.last_row !== this.row) {
			const max_offset = Math.max(0, content_rows - this.terminal.canvas.rows);
			let percent = 0;
			if (max_offset != 0) {
				percent = Math.round((this.row / max_offset) * 100);
			}
			const status_text = `\\f0\\B7 Drag, use mouse, or press [j/k], [↓/↑] to scroll [${percent}%] \\F7\\b0`;
			this.status_glyphs = textGlyphs(status_text, this.terminal.canvas.cols, false);
		}
	}

	update(content_rows: number) {
		const max_offset = Math.max(0, content_rows - this.terminal.canvas.rows);

		if (Math.abs(this.wheel_rows) > 0) {
			if (!this.terminal.canvas.mouse_down) {
				this.row_offset += this.wheel_rows;
			}

			this.wheel_rows = 0;
			this.drag_velocity = 0;
		}

		if (this.terminal.canvas.mouse_down) {
			if (this.terminal.canvas.mouse_owner === "") {
				this.terminal.canvas.mouse_owner = Scroller.NAME;

				this.is_dragging = true;
				this.drag_start_row = this.terminal.canvas.mouse_row;
				this.drag_start_row_offset = Math.round(this.row_offset);
				this.drag_last_row = this.terminal.canvas.mouse_row;
				this.drag_velocity = 0;
			}

			if (this.terminal.canvas.mouse_owner === Scroller.NAME) {
				const mouse_row = this.terminal.canvas.mouse_row;

				const row_delta = mouse_row - this.drag_last_row;
				this.drag_velocity = Math.max(-2, Math.min(2, row_delta));
				this.drag_last_row = mouse_row;

				const drag_delta = mouse_row - this.drag_start_row;
				this.row_offset = this.drag_start_row_offset - drag_delta;
			}
		} else {
			if (this.terminal.canvas.mouse_owner === Scroller.NAME) {
				this.is_dragging = false;
				this.terminal.canvas.mouse_owner = "";
			}

			if (Math.abs(this.drag_velocity) > 0.01) {
				this.row_offset -= this.drag_velocity;
				this.drag_velocity *= 0.95;
			}
		}

		if (isNaN(this.row_offset)) {
			this.row_offset = 0;
		}

		this.row_offset = Math.max(0, Math.min(max_offset, this.row_offset));
		this.last_row = this.row;
		this.row = Math.round(this.row_offset);

		// status text
		if (this.last_row !== this.row || this.last_content_rows !== content_rows) {
			let percent = 0;

			if (max_offset != 0) {
				percent = Math.round((this.row / max_offset) * 100);
			}

			const status_text = `\\f0\\B7 Drag, use mouse, or press [j/k], [↓/↑] to scroll [${percent}%] \\F7\\b0`;
			this.status_glyphs = textGlyphs(status_text, this.terminal.canvas.cols, false);
		}

		this.last_content_rows = content_rows;
	}
}
