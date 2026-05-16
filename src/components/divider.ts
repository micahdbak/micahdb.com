import { Terminal } from "../terminal.ts";

class Divider {
	private terminal: Terminal;
	private mouseWasDown: boolean;
	private dragging: boolean;
	private hovering: boolean;

	static readonly HORIZONTAL = 0;
	static readonly VERTICAL = 1;

	static readonly INTERSECT_NONE = 0;
	static readonly INTERSECT_RIGHT = 2;
	static readonly INTERSECT_LEFT = 1;
	static readonly INTERSECT_TOP = 3;
	static readonly INTERSECT_BOTTOM = 4;

	public frac: number;

	constructor(terminal: Terminal, frac: number) {
		this.terminal = terminal;
		this.mouseWasDown = false;
		this.dragging = false;
		this.frac = frac;
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
		intRow: number = 0,
		intCol: number = 0,
		intersect: number = Divider.INTERSECT_NONE
	) {
		if (
			intersect !== Divider.INTERSECT_NONE &&
			(intRow < row ||
				intRow >= row + rows ||
				intCol < col ||
				intCol >= col + cols)
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

		if (direction === Divider.HORIZONTAL) {
			drawn_row = row + Math.floor((rows - 1) * this.frac);
			drawn_col = col;
			drawn_rows = 1;
			drawn_cols = cols;
			intRow = drawn_row;

			const str = "─".repeat(cols);

			this.terminal.drawText(
				str,
				drawn_row,
				drawn_col,
				16,
				this.hovering ? 8 : 0
			);

			if (this.dragging) {
				const mouseRow =
					Math.max(Math.min(this.terminal.mouseRow, row + rows - 1), row) - row;
				this.frac = mouseRow / (rows - 1);
			}
		} else {
			drawn_row = row;
			drawn_col = col + Math.floor((cols - 1) * this.frac);
			drawn_rows = rows;
			drawn_cols = 1;
			intCol = drawn_col;

			for (let i = 0; i < rows; i++) {
				const ch = "│";
				this.terminal.drawText(
					ch,
					drawn_row + i,
					drawn_col,
					16,
					this.hovering ? 8 : 0
				);
			}

			if (this.dragging) {
				const mouseCol =
					Math.max(Math.min(this.terminal.mouseCol, col + cols - 1), col) - col;
				this.frac = mouseCol / (cols - 1);
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

			this.terminal.drawText(ch, intRow, intCol, 16, this.hovering ? 8 : 0);
		}

		// mouse tracking

		const mouseInside = this.terminal.mouseAt(
			drawn_row,
			drawn_col,
			drawn_rows,
			drawn_cols
		);

		if (!this.terminal.mouseDown) {
			this.mouseWasDown = false;
			this.dragging = false;

			if (mouseInside) {
				document.body.className = "grab";
				this.hovering = true;
			} else {
				this.hovering = false;
			}
		} else if (!this.mouseWasDown) {
			if (mouseInside) {
				this.dragging = true;
			} else {
				this.dragging = false;
			}

			this.mouseWasDown = true;
		} else if (this.dragging) {
			// mouse is dragging
			document.body.className = "grabbing";
			this.hovering = false;
		}
	}
}

export { Divider };
