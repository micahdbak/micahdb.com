import { Terminal } from "../terminal.ts";
import { Colour } from "../colour.ts";

class TableBorders {
	static draw(
		terminal: Terminal,
		row: number,
		col: number,
		trows: number,
		heights: number[],
		widths: number[],
		fgColour: Colour,
		bgColour: Colour = Colour.BG
	) {
		const hLine = (l: string, m: string, r: string) =>
			l + widths.map((w) => "─".repeat(w)).join(m) + r;

		const contentLine = "│" + widths.map((w) => " ".repeat(w)).join("│") + "│";

		let tableStr = hLine("┌", "┬", "┐") + "\n";

		for (let i = 0; i < trows; i++) {
			for (let j = 0; j < heights[i]; j++) {
				tableStr += contentLine + "\n";
			}

			if (i < trows - 1) {
				tableStr += hLine("├", "┼", "┤") + "\n";
			}
		}

		tableStr += hLine("└", "┴", "┘");

		terminal.drawText(tableStr, row, col, fgColour, bgColour);
	}
}

class Table {
	private terminal: Terminal;

	constructor(terminal: Terminal) {
		this.terminal = terminal;
	}

	private wrapText(text: string, maxWidth: number): string[] {
		if (maxWidth <= 0) {
			return [text];
		}

		const lines: string[] = [];
		let currentLine = "";
		const words = text.split(" ");

		for (let word of words) {
			if (word.length > maxWidth) {
				if (currentLine !== "") {
					lines.push(currentLine);
					currentLine = "";
				}

				while (word.length > maxWidth) {
					lines.push(word.substring(0, maxWidth));
					word = word.substring(maxWidth);
				}

				currentLine = word;
				continue;
			}

			const newLine = currentLine === "" ? word : currentLine + " " + word;

			if (newLine.length > maxWidth) {
				lines.push(currentLine);
				currentLine = word;
				continue;
			}

			currentLine = newLine;
		}

		if (currentLine !== "") {
			lines.push(currentLine);
		}

		return lines;
	}

	// returns # of rows drawn
	draw(
		row: number,
		col: number,
		rows: number,
		cols: number,
		cells: string[][],
		backColour: Colour,
		fgColour: Colour,
		borderColour: Colour
	): number {
		if (cells.length === 0) {
			return 0;
		}

		const numCols = cells[0].length;
		const availableWidth = cols - (numCols + 1);

		if (availableWidth <= 0) {
			return 0;
		}

		const colWidths: number[] = Array.from({ length: numCols }, () => 0);
		let totalMaxLen = 0;

		for (let c = 0; c < numCols; c++) {
			let maxLen = 0;
			for (let r = 0; r < cells.length; r++) {
				maxLen = Math.max(maxLen, cells[r][c].length);
			}
			colWidths[c] = maxLen;
			totalMaxLen += maxLen;
		}

		// distribute available width
		const finalWidths: number[] = Array.from({ length: numCols }, () => 0);

		if (totalMaxLen <= availableWidth) {
			// everything fits, just use the max lens or distribute the rest
			const remaining = availableWidth - totalMaxLen;

			for (let c = 0; c < numCols; c++) {
				finalWidths[c] = colWidths[c] + Math.floor(remaining / numCols);
			}

			// add the residue to the last column
			finalWidths[numCols - 1] += remaining % numCols;
		} else {
			// need to shrink columns proportionally
			for (let c = 0; c < numCols; c++) {
				finalWidths[c] = Math.max(
					1,
					Math.floor((colWidths[c] / totalMaxLen) * availableWidth)
				);
			}

			const currentSum = finalWidths.reduce((a, b) => a + b, 0);
			let diff = availableWidth - currentSum;

			// distribute diff to columns that have most content
			for (let i = numCols - 1; i >= 0 && diff > 0; i--) {
				finalWidths[i]++;
				diff--;
			}
		}

		// wrap text and determine row heights
		const rowHeights: number[] = Array.from({ length: cells.length }, () => 0);
		const wrappedCells: string[][][] = [];

		for (let r = 0; r < cells.length; r++) {
			const rowWrapped: string[][] = [];
			let maxHeight = 0;

			for (let c = 0; c < numCols; c++) {
				const lines = this.wrapText(cells[r][c], finalWidths[c]);
				rowWrapped.push(lines);
				maxHeight = Math.max(maxHeight, lines.length);
			}

			wrappedCells.push(rowWrapped);
			rowHeights[r] = maxHeight;
		}

		// draw borders
		TableBorders.draw(
			this.terminal,
			row,
			col,
			cells.length,
			rowHeights,
			finalWidths,
			backColour,
			borderColour
		);

		// draw cell content
		let currentRow = row + 1;

		for (let r = 0; r < cells.length; r++) {
			if (currentRow >= row + rows) {
				break;
			}

			for (let i = 0; i < rowHeights[r]; i++) {
				if (currentRow >= row + rows) {
					break;
				}

				let currentCol = col + 1;

				for (let c = 0; c < numCols; c++) {
					// pad line to column width
					const line = wrappedCells[r][c][i] || "";
					const paddedLine = line.padEnd(finalWidths[c], " ");

					this.terminal.drawText(
						paddedLine,
						currentRow,
						currentCol,
						fgColour,
						backColour
					);

					currentCol += finalWidths[c] + 1;
				}

				currentRow++;
			}

			currentRow++; // horizontal border line
		}

		return currentRow - row;
	}
}

export { TableBorders, Table };
