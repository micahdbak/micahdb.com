import { Terminal } from "../terminal.ts";

class ScrollBar {
	private terminal: Terminal;
	private lastMouseRow: number;

	public frac: number;

	constructor(terminal: Terminal) {
		this.terminal = terminal;
		this.frac = 0.0;
	}

	setFrac(frac: number) {
		this.frac = frac;
	}

	draw(startRow: number, startCol: number, rowCount: number) {
		// update this.frac
		if (
			this.terminal.mouseDown &&
			this.terminal.mouseAt(startRow, startCol, rowCount, 2)
		) {
			const mouseRow = Math.min(
				this.terminal.mouseRow - startRow,
				rowCount - 1
			);

			if (mouseRow != this.lastMouseRow) {
				this.lastMouseRow = mouseRow;
				this.frac = (mouseRow + 0.5) / rowCount;
			}
		}

		const thumbRow = startRow + Math.floor(this.frac * rowCount);

		this.terminal.drawText("▄▄", startRow - 1, startCol, 0, 8);

		for (let row = startRow; row < startRow + rowCount; row++) {
			let text = "  ";
			let bgColour = 8;
			let fgColour = 8;

			if (row === thumbRow) {
				text = "[]"; // "▓▓";
				bgColour = 15;
				fgColour = 8;
			}

			this.terminal.drawText(text, row, startCol, bgColour, fgColour);
		}

		this.terminal.drawText("▀▀", startRow + rowCount, startCol, 0, 8);
	}
}

export { ScrollBarScrollFunction, ScrollBar };
