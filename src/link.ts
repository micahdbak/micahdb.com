import * as tscon from "@micahdb/tscon";

export class Link {
	readonly url: string;
	readonly start: number;
	readonly end: number;

	private line: tscon.Glyphs | null = null;
	private spans: tscon.Spans | null = null;
	private decorated: tscon.Spans | null = null;
	private hovered: boolean | null = null;

	constructor(url: string, start: number, end: number) {
		this.url = url;
		this.start = start;
		this.end = end;
	}

	/**
	 * Pair group 0 openers with group 1 terminators in source order.
	 *
	 * An opener with options uses them as the URL; a bare opener uses its
	 * display text. Empty links and unmatched anchors produce no link, and a
	 * new opener replaces an unfinished one.
	 */
	static parse(glyphs: tscon.Glyphs): Link[] {
		const events: { group: number; anchor: tscon.Anchor }[] = [];

		for (const group of [0, 1]) {
			for (const anchor of glyphs.anchors[group] ?? []) {
				events.push({ group, anchor });
			}
		}

		events.sort((left, right) => {
			return left.anchor.start - right.anchor.start
				|| left.anchor.end - right.anchor.end
				|| right.group - left.group;
		});

		const links: Link[] = [];
		let opener: tscon.Anchor | null = null;

		for (const event of events) {
			if (event.group === 0) {
				opener = event.anchor;
				continue;
			}

			if (opener === null) {
				continue;
			}

			const start = opener.end;
			const end = event.anchor.start;
			const url = opener.options ?? glyphs.sourceText.slice(start, end);

			if (end > start && url.length > 0) {
				links.push(new Link(url, start, end));
			}

			opener = null;
		}

		return links;
	}

	/**
	 * Draw the link's cells at a line grid's origin and handle hover and
	 * clicks. The decorated copy is reused until the line, spans, or hover
	 * state changes.
	 */
	draw(
		terminal: tscon.Terminal,
		line: tscon.Glyphs,
		origin: tscon.Cell,
		clip?: tscon.Rect
	): void {
		const canvas = terminal.canvas;
		const spans = line.spansFor(this.start, this.end);
		const hovered = this.inside(canvas.mouse_row, canvas.mouse_col, spans, origin);
		const click = canvas.click;
		const pressed = this.inside(click.down_row, click.down_col, spans, origin);
		const released = this.inside(click.row, click.col, spans, origin);

		if (pressed && released && click.consume()) {
			this.activate();
		} else if (hovered) {
			canvas.class_name = "pointer";

			const detail = this.url.startsWith("#")
				? window.location.origin + this.url
				: this.url;

			terminal.detail_text = " " + detail + " ";
		}

		let decorated = this.decorated;

		if (
			decorated === null
			|| line !== this.line
			|| this.spans === null
			|| !spans.equals(this.spans)
			|| hovered !== this.hovered
		) {
			const foreground = hovered ? tscon.Colour.BG : tscon.Colour.BRIGHT_CYAN;
			const background = hovered ? tscon.Colour.BRIGHT_CYAN : tscon.Colour.BG;

			decorated = spans.mapCells((cell) => {
				const char_code = tscon.unpackCell(cell).char_code || 32;

				return tscon.packCell(char_code, foreground, background);
			});

			this.decorated = decorated;
			this.line = line;
			this.spans = spans;
			this.hovered = hovered;
		}

		decorated.blit(terminal, origin, clip);
	}

	private inside(
		row: number | undefined,
		col: number | undefined,
		spans: tscon.Spans,
		origin: tscon.Cell
	): boolean {
		if (row === undefined || col === undefined) {
			return false;
		}

		return spans.contains(row - origin.row, col - origin.col);
	}

	private activate(): void {
		if (this.url.startsWith("mailto:")) {
			const a = document.createElement("a");
			a.href = this.url;
			a.click();
		} else if (this.url.startsWith("#")) {
			window.location.hash = this.url;
		} else if (this.url.startsWith("/")) {
			window.location.href = this.url;
		} else {
			// opens in new tab
			window.open(this.url, "_blank");
		}
	}
}
