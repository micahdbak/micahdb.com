import { Glyph, Terminal } from "../terminal.ts";

class Link {
	private terminal: Terminal;
	private text: string;
	private url: string;

	constructor(terminal: Terminal, text: string, url: string) {
		this.terminal = terminal;
		this.text = text;
		this.url = url;
	}

	draw(
		row: number,
		col: number,
		backColour: number,
		fgColour: number,
		hoverBackColour: number,
		hoverFgColour: number
	) {
		const isHovered = this.terminal.mouseAt(row, col, 1, this.text.length);
		const wasHovered = this.terminal.mouseDownAt(row, col, 1, this.text.length);

		if (isHovered && wasHovered && this.terminal.mouseClick) {
			if (this.url.startsWith("mailto:")) {
				const a = document.createElement("a");
				a.href = this.url;
				a.click();
			} else {
				// opens in new tab
				window.open(this.url, "_blank");
			}
		}

		const bg = isHovered ? hoverBackColour : backColour;
		const fg = isHovered ? hoverFgColour : fgColour;

		this.terminal.drawText(
			this.text,
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
