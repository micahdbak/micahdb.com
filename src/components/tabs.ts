import { Terminal } from "../terminal.ts";
import { Colour } from "../colour.ts";

class Tabs {
	private terminal: Terminal;

	// which tab is selected
	public which: number;
	public rows: number;

	constructor(terminal: Terminal) {
		this.terminal = terminal;
		this.which = 0;
		this.rows = 1;
	}

	draw(
		tabs: string[],
		row: number,
		col: number,
		cols: number,
		bg_col: Colour,
		fg_col: Colour,
		sel_bg: Colour
	) {
		const rows: string[][] = [[]];
		const widths: number[] = [0];
		let rowi = 0;

		for (let tabi = 0; tabi < tabs.length; tabi++) {
			const tab = " " + tabs[tabi] + " ";

			// at least one tab is greater than the # of columns available
			if (cols < tab.length) {
				return;
			}

			// put this tab on the next row
			if (widths[rowi] + tab.length > cols) {
				// remove last divider in current row
				widths[rowi] = widths[rowi] - 1;

				rows.push([]);
				widths.push(0);
				rowi++;
			}

			rows[rowi].push(tab);

			if (tabi < tabs.length - 1) {
				// tabs remaining; consider divider
				widths[rowi] += tab.length + 1;
			} else {
				// last tab
				widths[rowi] += tab.length;
			}
		}

		let r = row;
		let tabi = 0;

		for (let i = 0; i < rows.length; i++) {
			let lcols = Math.floor((cols - widths[i]) / 2);
			const row_tabs = rows[i];

			for (let j = 0; j < row_tabs.length; j++) {
				const tab = row_tabs[j];
				const c = col + lcols;

				const is_hovered = this.terminal.canvas.mouseAt(r, c, 1, tab.length);
				const was_hovered = this.terminal.canvas.mouseDownAt(r, c, 1, tab.length);

				if (is_hovered && was_hovered && this.terminal.canvas.mouse_click) {
					this.which = tabi;
				}

				const bg = tabi === this.which ? sel_bg : is_hovered ? Colour.WHITE : bg_col;
				const fg = tabi === this.which ? fg_col : is_hovered ? Colour.BG : fg_col;

				this.terminal.drawText(tab, r, c, fg, bg);

				if (j < row_tabs.length - 1) {
					this.terminal.drawText("|", r, c + tab.length, bg_col, Colour.BG);
					lcols += tab.length + 1;
				} // else; will break

				tabi++;
			}

			r++;
		}

		this.rows = rows.length;
	}
}

export { Tabs };
