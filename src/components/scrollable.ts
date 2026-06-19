import { Terminal } from "../terminal.ts";
import { Colour } from "../colour.ts";

class Scrollable {
	private terminal: Terminal;

	private wheel_px: number = 0;
	private wheel_rows: number = 0;
	private wheel_mouse_row: number = 0;
	private wheel_mouse_col: number = 0;

	private velocity: number = 0;
	private last_mouse_row: number = 0;
	private is_dragging: boolean = false;
	private drag_start_offset: number = 0;
	private drag_start_mouse_row: number = 0;

	public row_offset: number = 0;

	constructor(terminal: Terminal) {
		this.terminal = terminal;

		this.terminal.renderer.canvas.addEventListener(
			"wheel",
			(event) => {
				switch (event.deltaMode) {
					case 0:
						this.wheel_px += event.deltaY;

						if (Math.abs(this.wheel_px) >= this.terminal.cellHeight) {
							this.wheel_rows += Math.floor(
								this.wheel_px / this.terminal.cellHeight
							);
							this.wheel_px %= this.terminal.cellHeight;
						}

						break;

					case 1:
						this.wheel_rows += event.deltaY;

						break;

					case 2:
						this.wheel_rows += event.deltaY * this.terminal.rows;

						break;
				}

				this.wheel_mouse_row = this.terminal.mouseRow;
				this.wheel_mouse_col = this.terminal.mouseCol;
			},
			{ passive: false }
		);
	}

	draw(
		row: number,
		col: number,
		rows: number,
		cols: number,
		inner_rows: number
	) {
		if (row < 0 || col < 0 || rows <= 0 || cols <= 0) {
			return;
		}

		const max_offset = Math.max(0, inner_rows - rows);

		// apply momentum to offset
		if (!this.terminal.mouseDown && Math.abs(this.velocity) > 0.01) {
			this.row_offset -= this.velocity;
			this.velocity *= 0.95;
		}

		if (
			this.wheel_mouse_row > row &&
			this.wheel_mouse_row < row + rows &&
			this.wheel_mouse_col > col &&
			this.wheel_mouse_col < col + cols &&
			this.wheel_rows !== 0
		) {
			this.row_offset += this.wheel_rows;
			this.wheel_rows = 0;
		}

		if (
			this.terminal.mouseAt(row, col, rows, cols) &&
			this.terminal.mouseDownAt(row, col, rows, cols)
		) {
			if (this.terminal.mouseOwner === "" && this.terminal.mouseDown) {
				this.terminal.mouseOwner = "scrollable";
				this.is_dragging = true;
				this.drag_start_offset = this.row_offset;
				this.drag_start_mouse_row = this.terminal.mouseRow;
				this.last_mouse_row = this.terminal.mouseRow;
				this.velocity = 0;
			}

			if (this.terminal.mouseOwner === "scrollable") {
				if (this.terminal.mouseDown) {
					const current_mouse_row = this.terminal.mouseRow;

					// Velocity for momentum
					const delta = current_mouse_row - this.last_mouse_row;
					this.velocity = Math.max(-2, Math.min(2, delta));
					this.last_mouse_row = current_mouse_row;

					// Position: content "sticks" to cursor
					const drag_delta = current_mouse_row - this.drag_start_mouse_row;
					this.row_offset = this.drag_start_offset - drag_delta;
				} else {
					this.is_dragging = false;
					this.terminal.mouseOwner = "";
				}
			}
		} else if (this.terminal.mouseOwner === "scrollable") {
			this.is_dragging = false;
			this.terminal.mouseOwner = "";
		}

		this.row_offset = Math.max(0, Math.min(this.row_offset, max_offset));

		// hints

		if (this.row_offset > 0) {
			const hint = "(Scroll Up)";
			const leftCols = Math.ceil((cols - hint.length) / 2);
			const rightCols = cols - hint.length - leftCols;
			const text = " ".repeat(leftCols) + hint + " ".repeat(rightCols);
			this.terminal.drawText(text, row, col, Colour.FG, Colour.BG);
		}

		if (inner_rows - this.row_offset > rows) {
			const hint = "(Scroll Down)";
			const leftCols = Math.ceil((cols - hint.length) / 2);
			const rightCols = cols - hint.length - leftCols;
			const text = " ".repeat(leftCols) + hint + " ".repeat(rightCols);
			this.terminal.drawText(text, row + rows - 1, col, Colour.FG, Colour.BG);
		}
	}
}

export { Scrollable };
