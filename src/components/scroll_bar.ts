import { Terminal } from "../terminal.ts";
import { Colour } from "../colour.ts";

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

		this.terminal.drawText(
			"▄▄",
			startRow - 1,
			startCol,
			Colour.BLACK,
			Colour.LIGHT_BLACK
		);

		for (let row = startRow; row < startRow + rowCount; row++) {
			let text = "  ";
			let bgColour = Colour.LIGHT_BLACK;
			let fgColour = Colour.LIGHT_BLACK;

			if (row === thumbRow) {
				text = "[]"; // "▓▓";
				bgColour = Colour.WHITE;
				fgColour = Colour.LIGHT_BLACK;
			}

			this.terminal.drawText(text, row, startCol, bgColour, fgColour);
		}

		this.terminal.drawText(
			"▀▀",
			startRow + rowCount,
			startCol,
			Colour.BLACK,
			Colour.LIGHT_BLACK
		);
	}
}

export { ScrollBarScrollFunction, ScrollBar };
