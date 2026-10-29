import { hasEscape, textGlyphs, textToLines, TextMap } from "@micahdb/tscon";
import type { Glyphs, ScreenPos } from "@micahdb/tscon";
import { Pos } from "./buffer.ts";
import type { Buffer } from "./buffer.ts";

export type DisplayRow = { line: number; row_in_line: number };

export type LinkAnchor = { line: number; row_in_line: number; col: number; options: string | null };

export type ImageAnchor = {
	line: number;
	row_in_line: number;
	col: number;
	name: string;
	rows: number;
	cols: number;
};

// a valid image anchor in the source: its span and its payload
type AnchorSpan = { start: number; length: number; payload: string };

type ScannedAnchors = { images: AnchorSpan[]; links: AnchorSpan[]; broken: number[] };

type LineMap = {
	glyphs: Glyphs;
	pieces: string[];
	map: TextMap;
	links: LinkAnchor[];
	images: ImageAnchor[];
};

// valid image anchors (group 2, payload closed on the line) are hidden;
// link anchors (group 0) are positioned where their text starts; broken
// ones (payload never closes) render raw, backslash included
function scanAnchorSpans(text: string): ScannedAnchors {
	const images: AnchorSpan[] = [];
	const links: AnchorSpan[] = [];
	const broken: number[] = [];

	for (let index = 0; index < text.length; index++) {
		const anchor = text[index] === "\\" && text[index + 1] === "a";
		const group = text[index + 2];

		if (!anchor || !/\d/.test(group ?? "") || text[index + 3] !== "{") {
			continue;
		}

		const closing = text.indexOf("}", index + 4);

		if (closing === -1) {
			broken.push(index);
			continue;
		}

		const span = {
			start: index,
			length: closing - index + 1,
			payload: text.slice(index + 4, closing),
		};

		if (group === "2") {
			images.push(span);
		} else if (group === "0") {
			links.push(span);
		}
	}

	return { images, links, broken };
}

function imageExtent(payload: string): { name: string; rows: number; cols: number } | null {
	const [name = "", rows = "", cols = ""] = payload.split("|");

	if (name === "") {
		return null;
	}

	return { name, rows: Math.max(1, Number(rows) || 1), cols: Math.max(1, Number(cols) || 1) };
}

// one compiled glyph row per piece; colour state restarts per row, which
// is harmless: only whole-line colour runs are used
function buildGrid(pieces: string[], width: number): Glyphs {
	const data = new Uint16Array(pieces.length * width);

	for (const [row, piece] of pieces.entries()) {
		data.set(textGlyphs(piece, width, false).data, row * width);
	}

	return { data, rows: pieces.length, cols: width, anchors: {} };
}

/**
 * Owns the wrap of every logical line at the current width: the compiled
 * glyph grids, the flat display-row table, the two-way mapping between
 * buffer positions and visible screen positions, and the anchor scan for
 * links and images. A buffer line corresponds to exactly one source line;
 * anchor payloads must close on their own line.
 */
export class Layout {
	private readonly maps: (LineMap | undefined)[] = [];
	private display_rows_cache: DisplayRow[] | null = null;
	private raw_line: number | null = null;

	constructor(
		private readonly buffer: Buffer,
		private wrap_width: number
	) {}

	// the width lines are wrapped to, for view decorations like the column
	// bar
	get wrapWidth(): number {
		return this.wrap_width;
	}

	setWidth(width: number): void {
		if (width === this.wrap_width) {
			return;
		}

		this.wrap_width = width;
		this.maps.length = 0;
		this.display_rows_cache = null;
	}

	invalidate(line: number): void {
		this.maps[line] = undefined;
		this.display_rows_cache = null;
	}

	// while the vi cursor rests on a line with escapes, that line renders
	// raw: every escape visible, no links or images. Moving away recompiles
	// it into its rendered form.
	setRawLine(line: number | null): void {
		if (line === this.raw_line) {
			return;
		}

		const previous = this.raw_line;
		this.raw_line = line;

		if (previous !== null) {
			this.invalidate(previous);
		}

		if (line !== null) {
			this.invalidate(line);
		}
	}

	invalidateFrom(line: number): void {
		this.maps.length = Math.min(this.maps.length, line);
		this.display_rows_cache = null;
	}

	grid(line: number): Glyphs {
		return this.compile(line).glyphs;
	}

	lineRowCount(line: number): number {
		return this.compile(line).pieces.length;
	}

	get displayRows(): DisplayRow[] {
		if (this.display_rows_cache !== null) {
			return this.display_rows_cache;
		}

		const rows: DisplayRow[] = [];

		for (let line = 0; line < this.buffer.lineCount(); line++) {
			for (let row_in_line = 0; row_in_line < this.compile(line).pieces.length; row_in_line++) {
				rows.push({ line, row_in_line });
			}
		}

		this.display_rows_cache = rows;
		return rows;
	}

	// display row index of the first wrapped row of each logical line
	get firstRowOfLine(): number[] {
		const rows: number[] = [];

		for (const [index, display_row] of this.displayRows.entries()) {
			if (display_row.row_in_line === 0) {
				rows[display_row.line] = index;
			}
		}

		return rows;
	}

	// the visible position of a buffer position, wrap included
	bufferToScreen(position: Pos): ScreenPos {
		return this.compile(position.line).map.positionAt(position.col);
	}

	/**
	 * Buffer position for a wrapped row and visible column, clamped the way
	 * vi clamps: off the ends of a wrapped row lands on its first or last
	 * character, and a blank row continues to the next row's first
	 * character.
	 */
	bufferAtVisibleCol(line: number, row_in_line: number, col: number): Pos {
		return new Pos(line, this.compile(line).map.indexAt(row_in_line, col));
	}

	screenToBuffer(screen_row: number, screen_col: number): Pos | null {
		const display_row = this.displayRows[screen_row];

		if (display_row === undefined) {
			return null;
		}

		return this.bufferAtVisibleCol(display_row.line, display_row.row_in_line, screen_col);
	}

	visibleLength(line: number, row_in_line: number): number {
		return this.compile(line).map.visibleLength(row_in_line);
	}

	// the number of display rows the line has while rendering raw, or null
	// when the line has no escapes and never changes
	rawRowCount(line: number): number | null {
		const text = this.buffer.lineText(line);

		if (!hasEscape(text)) {
			return null;
		}

		return textToLines(text.replaceAll("\\", "\\\\"), this.wrap_width, "hard").length;
	}

	links(): LinkAnchor[] {
		const links: LinkAnchor[] = [];

		for (let line = 0; line < this.buffer.lineCount(); line++) {
			links.push(...this.compile(line).links);
		}

		return links;
	}

	images(): ImageAnchor[] {
		const images: ImageAnchor[] = [];

		for (let line = 0; line < this.buffer.lineCount(); line++) {
			images.push(...this.compile(line).images);
		}

		return images;
	}

	private compile(line: number): LineMap {
		const cached = this.maps[line];

		if (cached !== undefined) {
			return cached;
		}

		const text = this.buffer.lineText(line);

		// the raw line renders every escape literally, links and images
		// included; every other line compiles anchors away -- an image anchor
		// renders nothing, and its region starts at the anchor's captured
		// position, over transparent cells
		let link_spans: AnchorSpan[] = [];
		let image_spans: AnchorSpan[] = [];
		let compile_text = text;

		if (line === this.raw_line && hasEscape(text)) {
			compile_text = text.replaceAll("\\", "\\\\");
		} else {
			const scanned = scanAnchorSpans(text);

			link_spans = scanned.links;
			image_spans = scanned.images;

			for (const start of [...scanned.broken].sort((a, b) => b - a)) {
				compile_text = compile_text.slice(0, start) + "\\" + compile_text.slice(start);
			}
		}

		const pieces = textToLines(compile_text, this.wrap_width, "hard");
		const map: LineMap = {
			glyphs: buildGrid(pieces, this.wrap_width),
			pieces,
			map: new TextMap(text, pieces),
			links: [],
			images: [],
		};

		// a link renders where its text starts -- the first character after
		// the anchor -- which wrapping may place on a later row than the
		// anchor itself
		for (const span of link_spans) {
			const text_start = map.map.buffer_to_visible[span.start + span.length];

			if (text_start === undefined) {
				continue;
			}

			map.links.push({
				line,
				row_in_line: text_start.row,
				col: text_start.col,
				options: span.payload,
			});
		}

		// an image's region starts at the anchor's captured position: the
		// cell of the glyph that follows it, or the line's end when nothing
		// does
		for (const span of image_spans) {
			const extent = imageExtent(span.payload);

			if (extent === null) {
				continue;
			}

			const at = map.map.positionAt(span.start);

			map.images.push({ line, row_in_line: at.row, col: at.col, ...extent });
		}

		this.maps[line] = map;
		return map;
	}
}
