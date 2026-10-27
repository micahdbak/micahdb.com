import { textGlyphs } from "@micahdb/tscon";
import type { Glyphs } from "@micahdb/tscon";
import { Pos } from "./buffer.ts";
import type { Buffer } from "./buffer.ts";

export type DisplayRow = { line: number; row_in_line: number };

export type ScreenPos = { row: number; col: number };

export type LinkAnchor = { line: number; row_in_line: number; col: number; options: string | null };

export type ImageAnchor = {
	line: number;
	row_in_line: number;
	col: number;
	name: string;
	rows: number;
	cols: number;
	anchor_cols: number;
};

type LineMap = {
	glyphs: Glyphs;
	pieces: string[];
	visible_to_buffer: number[][];
	buffer_to_visible: (ScreenPos | undefined)[];
	last_visible_buffer_col: number;
	links: LinkAnchor[];
	images: ImageAnchor[];
};

// a valid image anchor in the source: its span and its payload
type AnchorSpan = { start: number; length: number; payload: string };

type ScannedAnchors = { images: AnchorSpan[]; links: AnchorSpan[]; broken: number[] };

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

// whether tscon would transform anything on the line: anchors, colour
// escapes, or an escaped backslash all render differently from source
function hasEscape(text: string): boolean {
	for (let index = 0; index < text.length; ) {
		const { chars, visible } = scanEscape(text, index);

		if (chars !== 1 || visible !== 1) {
			return true;
		}

		index += chars;
	}

	return false;
}

function imageExtent(payload: string): { name: string; rows: number; cols: number } | null {
	const [name = "", rows = "", cols = ""] = payload.split("|");

	if (name === "") {
		return null;
	}

	return { name, rows: Math.max(1, Number(rows) || 1), cols: Math.max(1, Number(cols) || 1) };
}

/**
 * Lengths of the escape forms tscon understands: colours (\fX) are zero
 * width, anchors (\aX{...}) are zero width, and \\ displays one backslash.
 * An escape starts only at a real backslash -- the walk calls this at every
 * character.
 */
function scanEscape(text: string, index: number): { chars: number; visible: number } {
	if (text[index] !== "\\") {
		return { chars: 1, visible: 1 };
	}

	const next = text[index + 1];

	if (next !== undefined && "fFbB".includes(next) && /\d/.test(text[index + 2] ?? "")) {
		return { chars: 3, visible: 0 };
	}

	if (next === "\\") {
		return { chars: 2, visible: 1 };
	}

	if (next === "a" && /\d/.test(text[index + 2] ?? "")) {
		let chars = 3;

		// an unterminated anchor payload renders literally after the escape,
		// matching tscon
		if (text[index + 3] === "{") {
			const closing = text.indexOf("}", index + 4);

			if (closing !== -1) {
				chars = closing - index + 1;
			}
		}

		return { chars, visible: 0 };
	}

	return { chars: 1, visible: 1 };
}

/**
 * The visible position of a buffer column in a compiled line: escape
 * characters map to the next visible character, and past the last one to
 * end of line.
 */
function visiblePosition(map: LineMap, col: number): ScreenPos {
	const visible = map.buffer_to_visible[col];

	if (visible !== undefined) {
		return { row: visible.row, col: visible.col };
	}

	for (const forward of map.buffer_to_visible.slice(col)) {
		if (forward !== undefined) {
			return { row: forward.row, col: forward.col };
		}
	}

	const last_row = map.pieces.length - 1;
	const last_map = map.visible_to_buffer[last_row];
	return { row: last_row, col: last_map === undefined ? 0 : last_map.length };
}

/**
 * Rows of at most `width` visible characters each; zero-width escapes
 * stay attached to the visible character they precede.
 */
function hardWrap(text: string, width: number): string[] {
	const rows: string[] = [];
	let row = "";
	let visible = 0;

	for (let index = 0; index < text.length; ) {
		const { chars, visible: chunk_visible } = scanEscape(text, index);

		if (chunk_visible === 1 && visible === width) {
			rows.push(row);
			row = "";
			visible = 0;
		}

		row += text.slice(index, index + chars);
		visible += chunk_visible;
		index += chars;
	}

	if (row !== "" || rows.length === 0) {
		rows.push(row);
	}

	return rows;
}

/**
 * One compiled glyph row per piece. Colour state restarts per row, which
 * is harmless: only whole-line colour runs are used.
 */
function buildGrid(pieces: string[], width: number): Glyphs {
	const data = new Uint16Array(pieces.length * width);

	for (const [row, piece] of pieces.entries()) {
		data.set(textGlyphs(piece, width, false).data, row * width);
	}

	return { data, rows: pieces.length, cols: width, anchors: {} };
}

type ColMap = {
	visible_to_buffer: number[][];
	buffer_to_visible: (ScreenPos | undefined)[];
	last_visible_buffer_col: number;
};

/**
 * Maps buffer character positions to visible columns and back by walking
 * the laid-out pieces against the original line. A doubled backslash in
 * the pieces is a neutralized broken anchor (one source character) or an
 * escaped backslash (two).
 */
function buildColMap(original: string, pieces: string[]): ColMap {
	const visible_to_buffer: number[][] = [];
	const buffer_to_visible: (ScreenPos | undefined)[] = [];
	let buffer_index = 0;
	let last_visible_buffer_col = -1;

	for (const [row, piece] of pieces.entries()) {
		const row_map: number[] = [];
		visible_to_buffer[row] = row_map;

		let piece_index = 0;
		let visible_col = 0;

		while (piece_index < piece.length) {
			if (piece[piece_index] === "\\" && piece[piece_index + 1] === "\\") {
				const source_chars = original[buffer_index + 1] === "\\" ? 2 : 1;

				row_map[visible_col] = buffer_index;
				buffer_to_visible[buffer_index] = { row, col: visible_col };
				last_visible_buffer_col = buffer_index;
				visible_col++;

				piece_index += 2;
				buffer_index += source_chars;
				continue;
			}

			const { chars, visible } = scanEscape(piece, piece_index);

			if (visible === 1) {
				row_map[visible_col] = buffer_index;
				buffer_to_visible[buffer_index] = { row, col: visible_col };
				last_visible_buffer_col = buffer_index;
				visible_col++;
			}

			piece_index += chars;
			buffer_index += chars;
		}
	}

	return { visible_to_buffer, buffer_to_visible, last_visible_buffer_col };
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
		return visiblePosition(this.compile(position.line), position.col);
	}

	/**
	 * Buffer position for a wrapped row and visible column, clamped the way
	 * vi clamps: off the ends of a wrapped row lands on its first or last
	 * character, and a blank row continues to the next row's first
	 * character.
	 */
	bufferAtVisibleCol(line: number, row_in_line: number, col: number): Pos {
		const map = this.compile(line);
		const row_map = map.visible_to_buffer[row_in_line] ?? [];

		const clamped = row_map[Math.max(0, Math.min(col, row_map.length - 1))];

		if (clamped !== undefined) {
			return new Pos(line, clamped);
		}

		const next_map = map.visible_to_buffer[row_in_line + 1];

		if (row_in_line + 1 < map.pieces.length && next_map !== undefined && next_map[0] !== undefined) {
			return new Pos(line, next_map[0]);
		}

		return new Pos(line, Math.max(0, map.last_visible_buffer_col));
	}

	screenToBuffer(screen_row: number, screen_col: number): Pos | null {
		const display_row = this.displayRows[screen_row];

		if (display_row === undefined) {
			return null;
		}

		return this.bufferAtVisibleCol(display_row.line, display_row.row_in_line, screen_col);
	}

	visibleLength(line: number, row_in_line: number): number {
		return (this.compile(line).visible_to_buffer[row_in_line] ?? []).length;
	}

	// the number of display rows the line has while rendering raw, or null
	// when the line has no anchors and never changes
	rawRowCount(line: number): number | null {
		const text = this.buffer.lineText(line);

		if (!hasEscape(text)) {
			return null;
		}

		return hardWrap(text.replaceAll("\\", "\\\\"), this.wrap_width).length;
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

		// valid image anchors hide as spaces of their own length: the cursor
		// and every position map one-to-one with the source text, and the
		// image renders at the anchor's position. The raw line renders every
		// escape literally instead, links and images included.
		let link_spans: AnchorSpan[] = [];
		let image_spans: AnchorSpan[] = [];
		let compile_text = text;

		if (line === this.raw_line && hasEscape(text)) {
			compile_text = text.replaceAll("\\", "\\\\");
		} else {
			const scanned = scanAnchorSpans(text);

			link_spans = scanned.links;
			image_spans = scanned.images;

			for (const span of [...image_spans].sort((a, b) => b.start - a.start)) {
				const head = compile_text.slice(0, span.start);
				const tail = compile_text.slice(span.start + span.length);

				compile_text = head + " ".repeat(span.length) + tail;
			}

			for (const start of [...scanned.broken].sort((a, b) => b - a)) {
				compile_text = compile_text.slice(0, start) + "\\" + compile_text.slice(start);
			}
		}

		const pieces = hardWrap(compile_text, this.wrap_width);
		const glyphs = buildGrid(pieces, this.wrap_width);
		const col_map = buildColMap(text, pieces);

		const map: LineMap = { glyphs, pieces, links: [], images: [], ...col_map };

		// a link renders where its text starts -- the first character after
		// the anchor -- which wrapping may place on a later row than the
		// anchor itself
		for (const span of link_spans) {
			const text_start = map.buffer_to_visible[span.start + span.length];

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

		// an image's region starts where its anchor's first character sits in
		// the wrap
		for (const span of image_spans) {
			const extent = imageExtent(span.payload);

			if (extent === null) {
				continue;
			}

			const at = visiblePosition(map, span.start);

			map.images.push({ line, row_in_line: at.row, col: at.col, anchor_cols: span.length, ...extent });
		}

		this.maps[line] = map;
		return map;
	}
}
