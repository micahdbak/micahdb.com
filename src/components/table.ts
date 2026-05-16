import { Terminal } from "../terminal.ts";

class Table {
	private terminal: Terminal;

	constructor(terminal: Terminal) {
		this.terminal = terminal;
	}

	draw(
		row: number,
		col: number,
		trows: number,
		tcols: number,
		heights: number[],
		widths: number[],
		backColour: number,
		fgColour: number
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

		this.terminal.drawText(tableStr, row, col, backColour, fgColour);
	}
}

export { Table };
