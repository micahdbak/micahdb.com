import { Glyph, Terminal } from "../terminal.ts";

class Link {
	static draw(
		terminal: Terminal,
		text: string,
		url: string,
		row: number,
		col: number,
		backColour: number = 0,
		fgColour: number = 12,
		hoverBackColour: number = 15,
		hoverFgColour: number = 16
	) {
		const isHovered = terminal.mouseAt(row, col, 1, text.length);
		const wasHovered = terminal.mouseDownAt(row, col, 1, text.length);

		if (isHovered && wasHovered && terminal.mouseClick) {
			if (url.startsWith("mailto:")) {
				const a = document.createElement("a");
				a.href = url;
				a.click();
			} else {
				// opens in new tab
				window.open(url, "_blank");
			}
		} else if (isHovered) {
			document.body.className = "pointer";
		}

		const bg = isHovered ? hoverBackColour : backColour;
		const fg = isHovered ? hoverFgColour : fgColour;

		terminal.drawText(text, row, col, bg, fg, 0, 0, false, Glyph.ITALIC_FONT);
	}
}

export { Link };
