import { Terminal } from "../terminal.ts";

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
		backColour: number,
		fgColour: number,
		selBgColour: number
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
			const _tabs = rows[i];

			for (let j = 0; j < _tabs.length; j++) {
				const tab = _tabs[j];
				const c = col + lcols;

				const isHovered = this.terminal.mouseAt(r, c, 1, tab.length);
				const wasHovered = this.terminal.mouseDownAt(r, c, 1, tab.length);

				if (isHovered && wasHovered && this.terminal.mouseClick) {
					this.which = tabi;
				}

				const bg =
					tabi === this.which ? selBgColour : isHovered ? 15 : backColour;
				const fg = tabi === this.which ? fgColour : isHovered ? 16 : fgColour;

				this.terminal.drawText(tab, r, c, bg, fg);

				if (j < _tabs.length - 1) {
					this.terminal.drawText("|", r, c + tab.length, backColour, 16);
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
