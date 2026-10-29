import * as tscon from "@micahdb/tscon";

export class Link {
	private readonly terminal: tscon.Terminal;
	private readonly url: string;

	private glyphs: tscon.Glyphs | null = null;
	private glyphs_are_hovered: null | boolean;

	public readonly text: string;

	constructor(terminal: tscon.Terminal, text: string, url: string) {
		this.terminal = terminal;
		this.text = text;
		this.url = url;

		// null guarantees that glyphs will be compiled on first frame
		this.glyphs_are_hovered = null;
	}

	update(row: number, col: number): tscon.Glyphs {
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

		let glyphs = this.glyphs;

		if (glyphs === null || is_hovered !== this.glyphs_are_hovered) {
			this.glyphs_are_hovered = is_hovered;

			const fg = is_hovered ? tscon.Colour.BLACK : tscon.Colour.BRIGHT_BLUE;
			const bg = is_hovered ? tscon.Colour.BRIGHT_BLUE : tscon.Colour.BLACK;

			const fgv = fg % 8;
			const bgv = bg % 8;

			const fgc = fg > tscon.Colour.GREY ? "F" : "f";
			const bgc = bg > tscon.Colour.GREY ? "B" : "b";

			const text = `\\${fgc}${fgv}\\${bgc}${bgv}${this.text}`;
			glyphs = new tscon.Glyphs(text, this.text.length, { wrap: tscon.Wrap.TRUNCATE });
			this.glyphs = glyphs;
		}

		return glyphs;
	}
}
