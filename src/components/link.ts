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
		fg_col: Colour = Colour.LIGHT_BLUE,
		bg_col: Colour = Colour.BG,
		hover_fg: Colour = Colour.BG,
		hover_bg: Colour = Colour.LIGHT_BLUE
	) {
		const is_hovered = terminal.canvas.mouseAt(row, col, 1, text.length);
		const was_hovered = terminal.canvas.mouseDownAt(row, col, 1, text.length);

		if (is_hovered && was_hovered && terminal.canvas.mouse_click) {
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
		} else if (is_hovered) {
			document.body.className = "pointer";

			const detail = url.startsWith("#") ? window.location.origin + url : url;
			terminal.detailText = " " + detail + " ";
		}

		const bg = is_hovered ? hover_bg : bg_col;
		const fg = is_hovered ? hover_fg : fg_col;

		terminal.drawText(text, row, col, fg, bg, Glyph.ITALIC_FONT);
	}
}

export { Link };
