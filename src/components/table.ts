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
		fg: Colour,
		bg: Colour = Colour.BG
	) {
		function hLine(l: string, m: string, r: string) {
			return l + widths.map((w) => "─".repeat(w)).join(m) + r;
		}

		const inner_line = "│" + widths.map((w) => " ".repeat(w)).join("│") + "│";

		let text = hLine("┌", "┬", "┐") + "\n";

		for (let i = 0; i < trows; i++) {
			for (let j = 0; j < heights[i]; j++) {
				text += inner_line + "\n";
			}

			if (i < trows - 1) {
				text += hLine("├", "┼", "┤") + "\n";
			}
		}

		text += hLine("└", "┴", "┘");

		terminal.drawText(text, row, col, fg, bg);
	}
}

class Table {
	private terminal: Terminal;

	constructor(terminal: Terminal) {
		this.terminal = terminal;
	}

	private wrapText(text: string, max_width: number): string[] {
		if (max_width <= 0) {
			return [text];
		}

		const lines: string[] = [];
		let line = "";
		const words = text.split(" ");

		for (let word of words) {
			if (word.length > max_width) {
				if (line !== "") {
					lines.push(line);
					line = "";
				}

				while (word.length > max_width) {
					lines.push(word.substring(0, max_width));
					word = word.substring(max_width);
				}

				line = word;
				continue;
			}

			const new_line = line === "" ? word : line + " " + word;

			if (new_line.length > max_width) {
				lines.push(line);
				line = word;
				continue;
			}

			line = new_line;
		}

		if (line !== "") {
			lines.push(line);
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
		bg: Colour,
		fg: Colour,
		border: Colour
	): number {
		if (cells.length === 0) {
			return 0;
		}

		const num_cols = cells[0].length;
		const available_width = cols - (num_cols + 1);

		if (available_width <= 0) {
			return 0;
		}

		const col_widths: number[] = Array.from({ length: num_cols }, () => 0);
		let total_max_len = 0;

		for (let c = 0; c < num_cols; c++) {
			let max_len = 0;
			for (let r = 0; r < cells.length; r++) {
				max_len = Math.max(max_len, cells[r][c].length);
			}
			col_widths[c] = max_len;
			total_max_len += max_len;
		}

		// distribute available width
		const final_widths: number[] = Array.from({ length: num_cols }, () => 0);

		if (total_max_len <= available_width) {
			// everything fits, just use the max lens or distribute the rest
			const remaining = available_width - total_max_len;

			for (let c = 0; c < num_cols; c++) {
				final_widths[c] = col_widths[c] + Math.floor(remaining / num_cols);
			}

			// add the residue to the last column
			final_widths[num_cols - 1] += remaining % num_cols;
		} else {
			// need to shrink columns proportionally
			for (let c = 0; c < num_cols; c++) {
				final_widths[c] = Math.max(
					1,
					Math.floor((col_widths[c] / total_max_len) * available_width)
				);
			}

			const current_sum = final_widths.reduce((a, b) => a + b, 0);
			let diff = available_width - current_sum;

			// distribute diff to columns that have most content
			for (let i = num_cols - 1; i >= 0 && diff > 0; i--) {
				final_widths[i]++;
				diff--;
			}
		}

		// wrap text and determine row heights
		const row_heights: number[] = Array.from({ length: cells.length }, () => 0);
		const wrapped_cells: string[][][] = [];

		for (let r = 0; r < cells.length; r++) {
			const row_wrapped: string[][] = [];
			let max_height = 0;

			for (let c = 0; c < num_cols; c++) {
				const lines = this.wrapText(cells[r][c], final_widths[c]);
				row_wrapped.push(lines);
				max_height = Math.max(max_height, lines.length);
			}

			wrapped_cells.push(row_wrapped);
			row_heights[r] = max_height;
		}

		// draw borders
		TableBorders.draw(this.terminal, row, col, cells.length, row_heights, final_widths, bg, border);

		// draw cell content
		let current_row = row + 1;

		for (let r = 0; r < cells.length; r++) {
			if (current_row >= row + rows) {
				break;
			}

			for (let i = 0; i < row_heights[r]; i++) {
				if (current_row >= row + rows) {
					break;
				}

				let current_col = col + 1;

				for (let c = 0; c < num_cols; c++) {
					// pad line to column width
					let line = wrapped_cells[r][c][i] || "";
					line = line.padEnd(final_widths[c], " ");

					this.terminal.drawText(line, current_row, current_col, fg, bg);

					current_col += final_widths[c] + 1;
				}

				current_row++;
			}

			current_row++; // horizontal border line
		}

		return current_row - row;
	}
}

export { TableBorders, Table };
