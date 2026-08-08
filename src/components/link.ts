import { Glyphs, textGlyphs, Terminal, Colour } from "@creat/tscon";

export class Link {
	private terminal: Terminal;
	private text: string;
	private url: string;

	private glyphs_are_hovered: null | boolean;

	public glyphs: Glyphs;

	constructor(terminal: Terminal, text: string, url: string) {
		this.terminal = terminal;
		this.text = text;
		this.url = url;

		// null guarantees that glyphs will be compiled on first frame
		this.glyphs_are_hovered = null;
	}

	update(row: number, col: number) {
		const is_hovered = this.terminal.canvas.mouseAt(row, col, 1, this.text.length);
		const was_hovered = this.terminal.canvas.mouseDownAt(row, col, 1, this.text.length);

		if (is_hovered && was_hovered && this.terminal.canvas.mouse_click) {
			if (this.url.startsWith("mailto:")) {
				const a = document.createElement("a");
				a.href = this.url;
				a.click();
			} else if (this.url.startsWith("#")) {
				window.location.hash = this.url;
			} else {
				// opens in new tab
				window.open(this.url, "_blank");
			}
		} else if (is_hovered) {
			this.terminal.canvas.class_name = "pointer";

			const detail = this.url.startsWith("#") ? window.location.origin + this.url : this.url;
			this.terminal.detail_text = " Link: " + detail + " ";
		}

		if (is_hovered !== this.glyphs_are_hovered) {
			this.glyphs_are_hovered = is_hovered;

			const fg = is_hovered ? Colour.BLACK : Colour.BRIGHT_BLUE;
			const bg = is_hovered ? Colour.BRIGHT_BLUE : Colour.BLACK;

			const fgv = fg % 8;
			const bgv = bg % 8;

			const fgc = fg > Colour.GREY ? "F" : "f";
			const bgc = bg > Colour.GREY ? "B" : "b";

			const text = `\\${fgc}${fgv}\\${bgc}${bgv}${this.text}`;
			this.glyphs = textGlyphs(text, this.text.length, false);
		}
	}
}
