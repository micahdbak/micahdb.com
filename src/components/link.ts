import * as tscon from "@micahdb/tscon";

/**
 * A rendered link. Each instance owns the decorated line grid and the spans
 * that `View` copies to the terminal for that link. The payload text's glyphs
 * are drawn over those spans; the following source glyphs only determine the
 * link's wrap geometry and hit targets.
 */
export class Link {
	readonly text: string;
	readonly url: string;

	private readonly terminal: tscon.Terminal;
	private readonly text_glyphs: tscon.Glyphs;

	private line: tscon.Glyphs | null = null;
	private current_spans: tscon.CellSpan[] = [];
	private hovered: boolean | null = null;
	private glyphs: tscon.Glyphs | null = null;

	constructor(terminal: tscon.Terminal, text: string, url: string) {
		this.terminal = terminal;
		this.text = text;
		this.url = url;
		this.text_glyphs = new tscon.Glyphs(text, text.length, {
			wrap: tscon.Wrap.TRUNCATE,
		});
	}

	/** The spans of the current decorated line grid that this link occupies. */
	get spans(): readonly tscon.CellSpan[] {
		return this.current_spans;
	}

	/**
	 * Update the link's decoration for the current line grid and return the
	 * decorated grid. Reuses the previous block unless the line, spans, or
	 * hover state changed.
	 */
	update(
		line: tscon.Glyphs,
		source_index: number,
		line_screen_row: number,
		pad_cols: number
	): tscon.Glyphs {
		const canvas = this.terminal.canvas;
		const spans = line.spansFor(source_index, source_index + this.text.length);
		const is_hovered = spans.some((span) => {
			return canvas.mouseAt(
				line_screen_row + span.row,
				pad_cols + span.from,
				1,
				span.to - span.from
			);
		});
		const was_hovered = spans.some((span) => {
			return canvas.mouseDownAt(
				line_screen_row + span.row,
				pad_cols + span.from,
				1,
				span.to - span.from
			);
		});

		if (is_hovered && was_hovered && canvas.mouse_click) {
			this.activate();
		} else if (is_hovered) {
			canvas.class_name = "pointer";

			const detail = this.url.startsWith("#")
				? window.location.origin + this.url
				: this.url;

			this.terminal.detail_text = " Link: " + detail + " ";
		}

		const spans_changed = !spansEqual(this.current_spans, spans);
		let glyphs = this.glyphs;

		if (
			glyphs === null
			|| line !== this.line
			|| spans_changed
			|| is_hovered !== this.hovered
		) {
			const fg = is_hovered ? tscon.Colour.BLACK : tscon.Colour.BRIGHT_BLUE;
			const bg = is_hovered ? tscon.Colour.BRIGHT_BLUE : tscon.Colour.BLACK;

			let offset = 0;

			glyphs = line.mapCells((cell, row, col) => {
				if (!inSpans(spans, row, col)) {
					return cell;
				}

				const text_cell = this.text_glyphs.data[offset++];

				if (text_cell === undefined) {
					return cell;
				}

				const char_code = (text_cell & 0xff) || 32;

				return ((fg & 0xf) << 12) | ((bg & 0xf) << 8) | char_code;
			});

			this.glyphs = glyphs;
			this.line = line;
			this.current_spans = spans;
			this.hovered = is_hovered;
		}

		return glyphs;
	}

	private activate(): void {
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
	}
}

function spansEqual(a: readonly tscon.CellSpan[], b: readonly tscon.CellSpan[]): boolean {
	if (a.length !== b.length) {
		return false;
	}

	for (let index = 0; index < a.length; index++) {
		const left = a[index]!;
		const right = b[index]!;

		if (left.row !== right.row || left.from !== right.from || left.to !== right.to) {
			return false;
		}
	}

	return true;
}

function inSpans(spans: readonly tscon.CellSpan[], row: number, col: number): boolean {
	for (const span of spans) {
		if (span.row === row && col >= span.from && col < span.to) {
			return true;
		}
	}

	return false;
}
