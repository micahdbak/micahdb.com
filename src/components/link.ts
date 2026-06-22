import { Glyph } from "../glyph.ts";
import { Terminal } from "../terminal.ts";
import { Colour } from "../colour.ts";

class Link {
	static draw(
		terminal: Terminal,
		text: string,
		url: string,
		row: number,
		col: number,
		backColour: Colour = Colour.BG,
		fgColour: Colour = Colour.LIGHT_BLUE,
		hoverBackColour: Colour = Colour.LIGHT_BLUE,
		hoverFgColour: Colour = Colour.BG
	) {
		const isHovered = terminal.canvas.mouseAt(row, col, 1, text.length);
		const wasHovered = terminal.canvas.mouseDownAt(row, col, 1, text.length);

		if (isHovered && wasHovered && terminal.canvas.mouse_click) {
			if (url.startsWith("mailto:")) {
				const a = document.createElement("a");
				a.href = url;
				a.click();
			} else if (url.startsWith("#")) {
				window.location.hash = url;
			} else {
				// opens in new tab
				window.open(url, "_blank");
			}
		} else if (isHovered) {
			document.body.className = "pointer";

			const detail = url.startsWith("#") ? window.location.origin + url : url;
			terminal.detailText = " " + detail + " ";
		}

		const bg = isHovered ? hoverBackColour : backColour;
		const fg = isHovered ? hoverFgColour : fgColour;

		terminal.drawText(text, row, col, fg, bg, Glyph.ITALIC_FONT);
	}
}

export { Link };
