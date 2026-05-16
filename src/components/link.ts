import { Glyph, Terminal } from "../terminal.ts";

class Link {
	private terminal: Terminal;

	constructor(terminal: Terminal) {
		this.terminal = terminal;
	}

	draw(
		text: string,
		url: string,
		row: number,
		col: number,
		backColour: number,
		fgColour: number,
		hoverBackColour: number,
		hoverFgColour: number
	) {
		const isHovered = this.terminal.mouseAt(row, col, 1, text.length);

		if (isHovered && this.terminal.mouseClick) {
			if (url.startsWith("mailto:")) {
				const a = document.createElement("a");
				a.href = url;
				a.click();
			} else {
				// opens in new tab
				window.open(url, "_blank");
			}
		}

		const bg = isHovered ? hoverBackColour : backColour;
		const fg = isHovered ? hoverFgColour : fgColour;

		this.terminal.drawText(
			text,
			row,
			col,
			bg,
			fg,
			0,
			0,
			false,
			Glyph.ITALIC_FONT
		);
	}
}

export { Link };
