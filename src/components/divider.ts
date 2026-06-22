import { Terminal } from "../terminal.ts";
import { Colour } from "../colour.ts";

class Divider {
	private terminal: Terminal;
	private frac: number;
	private interactive: boolean;
	private mouse_was_down: boolean;
	private dragging: boolean;
	private hovering: boolean;

	static readonly HORIZONTAL = 0;
	static readonly VERTICAL = 1;

	static readonly INTERSECT_NONE = 0;
	static readonly INTERSECT_RIGHT = 2;
	static readonly INTERSECT_LEFT = 1;
	static readonly INTERSECT_TOP = 3;
	static readonly INTERSECT_BOTTOM = 4;

	public trows: number;
	public lcols: number;

	constructor(terminal: Terminal, frac: number, interactive: boolean) {
		this.terminal = terminal;
		this.frac = frac;
		this.interactive = interactive;
		this.mouse_was_down = false;
		this.dragging = false;
	}

	setFrac(frac: number) {
		this.frac = frac;
	}

	draw(
		direction: number,
		row: number,
		col: number,
		rows: number,
		cols: number,
		min_row: number = 0,
		min_col: number = 0,
		int_row: number = 0,
		int_col: number = 0,
		intersect: number = Divider.INTERSECT_NONE
	) {
		if (
			intersect !== Divider.INTERSECT_NONE &&
			(int_row < row || int_row >= row + rows || int_col < col || int_col >= col + cols)
		) {
			intersect = Divider.INTERSECT_NONE;
		}

		if (
			row < 0 ||
			col < 0 ||
			rows < 2 ||
			cols < 2 ||
			row + rows > this.terminal.rows ||
			col + cols > this.terminal.cols
		) {
			return;
		}

		let drawn_row, drawn_col, drawn_rows, drawn_cols;

		const fg = this.hovering ? Colour.LIGHT_BLACK : Colour.BLACK;

		if (direction === Divider.HORIZONTAL) {
			drawn_row = row + Math.floor((rows - 1) * this.frac);
			drawn_col = col;
			drawn_rows = 1;
			drawn_cols = cols;
			int_row = drawn_row;

			if (drawn_row < min_row) {
				drawn_row = min_row;
				int_row = min_row;
			}

			this.trows = drawn_row - row;
			this.lcols = cols;

			const str = "─".repeat(cols);

			this.terminal.drawText(str, drawn_row, drawn_col, fg);

			if (this.dragging) {
				let mouse_row =
					Math.max(Math.min(this.terminal.canvas.mouse_row, row + rows - 1), row) - row;
				mouse_row = Math.max(mouse_row, min_row);
				this.frac = mouse_row / (rows - 1);
			}
		} else {
			drawn_row = row;
			drawn_col = col + Math.floor((cols - 1) * this.frac);
			drawn_rows = rows;
			drawn_cols = 1;
			int_col = drawn_col;

			if (drawn_col < min_col) {
				drawn_col = min_col;
				int_col = min_col;
			}

			this.trows = rows;
			this.lcols = drawn_col - col;

			for (let i = 0; i < rows; i++) {
				this.terminal.drawText("│", drawn_row + i, drawn_col, fg);
			}

			if (this.dragging) {
				let mouse_col =
					Math.max(Math.min(this.terminal.canvas.mouse_col, col + cols - 1), col) - col;
				mouse_col = Math.max(mouse_col, min_col);
				this.frac = mouse_col / (cols - 1);
			}
		}

		if (intersect !== Divider.INTERSECT_NONE) {
			let ch;

			switch (intersect) {
				case Divider.INTERSECT_RIGHT:
					ch = "├";
					break;
				case Divider.INTERSECT_LEFT:
					ch = "┤";
					break;
				case Divider.INTERSECT_TOP:
					ch = "┴";
					break;
				case Divider.INTERSECT_BOTTOM:
					ch = "┬";
					break;
			}

			this.terminal.drawText(ch, int_row, int_col, fg);
		}

		// mouse tracking

		if (!this.interactive) {
			return;
		}

		const mouse_inside = this.terminal.canvas.mouseAt(drawn_row, drawn_col, drawn_rows, drawn_cols);

		if (!this.terminal.canvas.mouse_down) {
			if (this.dragging) {
				this.terminal.canvas.mouse_owner = "";
			}
			this.mouse_was_down = false;
			this.dragging = false;

			if (mouse_inside) {
				document.body.className = "grab";
				this.hovering = true;
			} else {
				this.hovering = false;
			}
		} else if (!this.mouse_was_down) {
			if (mouse_inside && this.terminal.canvas.mouse_owner === "") {
				this.dragging = true;
				this.terminal.canvas.mouse_owner = "divider";
			} else {
				this.dragging = false;
			}

			this.mouse_was_down = true;
		} else if (this.dragging) {
			// mouse is dragging
			document.body.className = "grabbing";
			this.hovering = false;
		}
	}
}

export { Divider };
