import * as tscon from "@micahdb/tscon";
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

function imageExtent(payload: string): { name: string; rows: number; cols: number } | null {
	const [name = "", rows = "", cols = ""] = payload.split("|");

	if (name === "") {
		return null;
	}

	return { name, rows: Math.max(1, Number(rows) || 1), cols: Math.max(1, Number(cols) || 1) };
}

/**
 * Owns the wrap of every logical line at the current width: each line's
 * compiled {@link tscon.Glyphs} -- cells, anchors, and the source-to-cell map
 * in one object -- plus the flat display-row table and the buffer/screen
 * conversions over them. A buffer line corresponds to exactly one source
 * line; anchor payloads must close on their own line.
 */
export class Layout {
	private readonly lines: (tscon.Glyphs | undefined)[] = [];
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
		this.lines.length = 0;
		this.display_rows_cache = null;
	}

	invalidate(line: number): void {
		this.lines[line] = undefined;
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
		this.lines.length = Math.min(this.lines.length, line);
		this.display_rows_cache = null;
	}

	grid(line: number): tscon.Glyphs {
		return this.compile(line);
	}

	lineRowCount(line: number): number {
		return this.compile(line).rows;
	}

	get displayRows(): DisplayRow[] {
		if (this.display_rows_cache !== null) {
			return this.display_rows_cache;
		}

		const rows: DisplayRow[] = [];

		for (let line = 0; line < this.buffer.lineCount(); line++) {
			for (let row_in_line = 0; row_in_line < this.compile(line).rows; row_in_line++) {
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

	// the visible cell of a buffer position, wrap included
	bufferToScreen(position: Pos): tscon.Cell {
		return this.compile(position.line).cursorCell(position.col);
	}

	/**
	 * Buffer position for a wrapped row and visible column, clamped the way
	 * vi clamps: off the ends of a wrapped row lands on its first or last
	 * character, and a blank row continues to the next row's first
	 * character.
	 */
	bufferAtVisibleCol(line: number, row_in_line: number, col: number): Pos {
		return new Pos(line, this.compile(line).cursorIndex(row_in_line, col));
	}

	screenToBuffer(screen_row: number, screen_col: number): Pos | null {
		const display_row = this.displayRows[screen_row];

		if (display_row === undefined) {
			return null;
		}

		return this.bufferAtVisibleCol(display_row.line, display_row.row_in_line, screen_col);
	}

	visibleLength(line: number, row_in_line: number): number {
		return this.compile(line).rowCols(row_in_line);
	}

	// the number of display rows the line has while rendering raw, or null
	// when the line has no escapes and never changes
	rawRowCount(line: number): number | null {
		const text = this.buffer.lineText(line);

		if (!tscon.hasEscape(text)) {
			return null;
		}

		return tscon.textToLines(text, this.wrap_width, { wrap: tscon.Wrap.HARD, raw: true }).length;
	}

	links(): LinkAnchor[] {
		const links: LinkAnchor[] = [];

		for (let line = 0; line < this.buffer.lineCount(); line++) {
			for (const anchor of this.compile(line).anchors[0] ?? []) {
				// a bare \a0 without a payload is not a link
				if (anchor.options === null) {
					continue;
				}

				links.push({
					line,
					row_in_line: anchor.row,
					col: anchor.col,
					options: anchor.options,
				});
			}
		}

		return links;
	}

	images(): ImageAnchor[] {
		const images: ImageAnchor[] = [];

		for (let line = 0; line < this.buffer.lineCount(); line++) {
			for (const anchor of this.compile(line).anchors[2] ?? []) {
				const extent = imageExtent(anchor.options ?? "");

				if (extent === null) {
					continue;
				}

				images.push({ line, row_in_line: anchor.row, col: anchor.col, ...extent });
			}
		}

		return images;
	}

	private compile(line: number): tscon.Glyphs {
		const cached = this.lines[line];

		if (cached !== undefined) {
			return cached;
		}

		const text = this.buffer.lineText(line);

		// while the cursor rests on a line with escapes, that line renders
		// raw: every escape visible as typed, no links or images. Every
		// other line compiles escapes away -- links and image regions read
		// back out of the compiled anchors, and a payload that never closes
		// renders as raw text on its own
		const compiled = new tscon.Glyphs(text, this.wrap_width, {
			wrap: tscon.Wrap.HARD,
			raw: line === this.raw_line && tscon.hasEscape(text),
		});

		this.lines[line] = compiled;
		return compiled;
	}
}
