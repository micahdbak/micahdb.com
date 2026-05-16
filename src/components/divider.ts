import { Terminal } from "../terminal.ts";

class Divider {
	private terminal: Terminal;
	private mouseWasDown: boolean;
	private dragging: boolean;

	static readonly HORIZONTAL = 0;
	static readonly VERTICAL = 1;

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
		cols: number
	) {
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

			let str;

			if (cols % 2 === 0) {
				const padding = " ".repeat((cols - 2) / 2);
				str = padding + "──" + padding;
			} else {
				const padding = " ".repeat((cols - 3) / 2);
				str = padding + "───" + padding;
			}

			this.terminal.drawText(str, drawn_row, drawn_col, 0, 8);

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

			const center = Math.floor(rows / 2);

			for (let i = 0; i < rows; i++) {
				let bar = false;

				if (rows % 2 === 0) {
					bar = i === center - 1 || i === center;
				} else {
					bar = i === center;
				}

				const ch = bar ? "│" : " ";
				this.terminal.drawText(ch, drawn_row + i, drawn_col, 0, 8);
			}

			if (this.dragging) {
				const mouseCol =
					Math.max(Math.min(this.terminal.mouseCol, col + cols - 1), col) - col;
				this.frac = mouseCol / (cols - 1);
			}
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
		}
	}
}

export { Divider };
