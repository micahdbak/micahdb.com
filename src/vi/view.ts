import { Colour, TexGlyphMode, textureGlyphs, textGlyphs } from "@micahdb/tscon";
import type { Glyphs, TexGlyphs, Terminal, Renderer } from "@micahdb/tscon";
import { Link } from "@/components/link.ts";
import type { DisplayRow, ImageAnchor, Layout } from "./layout.ts";
import type { Editor } from "./editor/editor.ts";
import type { Viewport } from "./viewport.ts";

const TILDE = textGlyphs("\\F0~", 1, false);
const TILDE_AT = { row: 0, col: 0, rows: 1, cols: 1 };

const SELECTION_BG = Colour.BRIGHT_BLACK;
const CURSOR_BG = Colour.WHITE;
const BAR_BG = Colour.BRIGHT_BLACK;
const BAR_COLUMN = 80;

export type ViewDependencies = {
	editor: Editor;
	layout: Layout;
	viewport: Viewport;
	textures: Map<string, WebGLTexture>;
	pad_cols: number;
	filename: string;
};

type BlankSpan = { from_col: number; to_col: number };

type InvertSpan = { from_col: number; to_col: number; blank_bg: number } | null;

/**
 * A copy of one glyph row with two optional transforms: whitespace cells in
 * the blank spans (image regions and hidden anchors) are zeroed so the
 * texture shows through them (real characters the user typed there survive
 * and render over the image), and the invert span swaps fg/bg nibbles for
 * the selection or cursor, painting blank cells as blocks.
 */
function preparedRow(glyphs: Glyphs, row: number, blanks: BlankSpan[], invert: InvertSpan): Glyphs {
	const cols = glyphs.cols;
	const data = glyphs.data.slice(row * cols, (row + 1) * cols);

	for (const span of blanks) {
		for (let col = Math.max(0, span.from_col); col < Math.min(cols, span.to_col); col++) {
			const cell = data[col];

			if (cell !== undefined && isBlankCell(cell)) {
				data[col] = 0;
			}
		}
	}

	if (invert !== null) {
		for (let col = Math.max(0, invert.from_col); col < Math.min(cols, invert.to_col); col++) {
			const cell = data[col];

			if (cell === undefined) {
				continue;
			}

			// swap the fg (bits 12-15) and bg (bits 8-11) nibbles; a blank
			// sentinel paints as a solid block
			const fg = (cell >> 12) & 0xf;
			const bg = (cell >> 8) & 0xf;

			if (cell === 0) {
				data[col] = (Colour.BLACK << 12) | (invert.blank_bg << 8) | 32;
				continue;
			}

			data[col] = (bg << 12) | (fg << 8) | (cell & 0xff);
		}
	}

	return { data, rows: 1, cols, anchors: {} };
}

// whitespace cells are the placeholder: only they give way to the texture
function isBlankCell(cell: number): boolean {
	const char = cell & 0xff;
	return cell === 0 || char === 32 || char === 9;
}

// the column bar sits behind whatever text is in the column
function paintBar(row: Glyphs, col: number): void {
	const cell = row.data[col];

	if (cell === undefined) {
		return;
	}

	row.data[col] = cell === 0 ? BAR_BG << 8 | 32 : cell & 0xf0ff | BAR_BG << 8;
}

/**
 * A sub-rectangle of a texture-glyph grid, for image regions that only
 * partially overlap the canvas.
 */
function sliceTextureGlyphs(
	texture_glyphs: TexGlyphs,
	first_row: number,
	first_col: number,
	rows: number,
	cols: number
): TexGlyphs {
	const data = new Uint32Array(rows * cols);

	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const cell = texture_glyphs.data[(first_row + row) * texture_glyphs.cols + (first_col + col)];

			if (cell !== undefined) {
				data[row * cols + col] = cell;
			}
		}
	}

	return { data, rows, cols };
}

/**
 * Renders one frame: the visible slice of display rows, the tilde rows past
 * the end of the buffer, the selection and cursor overlays, the links, the
 * status / command line, then the image regions under the text, and finally
 * the terminal frame -- text draws over images, and blank cells stay
 * transparent so the textures show through.
 */
export class View {
	private readonly links = new Map<string, Link>();
	private readonly texture_glyphs = new Map<string, TexGlyphs>();
	private frame_regions: { anchor: ImageAnchor; first_display_row: number }[] = [];

	constructor(
		private readonly terminal: Terminal,
		private readonly renderer: Renderer,
		private readonly dependencies: ViewDependencies
	) {}

	render(): void {
		const canvas = this.terminal.canvas;
		const { editor, layout, viewport } = this.dependencies;

		layout.setRawLine(editor.cursor.pos.line);

		const display = layout.displayRows;
		const usable = Math.max(1, canvas.rows - 1);
		const pad = this.dependencies.pad_cols;
		const first = layout.firstRowOfLine;

		// the bar marks the classic print margin when the terminal is wide
		// enough for column 80 to exist
		const bar_col = layout.wrapWidth > BAR_COLUMN ? BAR_COLUMN - 1 : null;

		this.frame_regions = layout.images().map((anchor) => ({
			anchor,
			first_display_row: (first[anchor.line] ?? 0) + anchor.row_in_line,
		}));

		for (let row = 0; row < usable; row++) {
			const display_index = viewport.top + row;
			const display_row = display[display_index];

			if (display_row === undefined) {
				this.terminal.blit(TILDE, TILDE_AT, { row, col: 0, rows: 1, cols: 1 });
				continue;
			}

			const prepared = this.preparedRowAt(display_row, null);

			// only the first row of a wrapped line is on the physical line
			// that owns column 80
			if (bar_col !== null && display_row.row_in_line === 0) {
				paintBar(prepared, bar_col);
			}

			this.blitRow(prepared, row, pad);
		}

		this.drawSelection(usable);
		this.drawCursor(usable);
		this.drawLinks(usable);
		this.drawStatus();
		this.drawImages(usable);
		this.terminal.draw();
	}

	// the column spans whose whitespace cells give way to the texture on the
	// given display row: the image region, plus the hidden anchor text on
	// its own row
	private blankSpansAt(display_index: number): BlankSpan[] {
		const spans: BlankSpan[] = [];

		for (const { anchor, first_display_row } of this.frame_regions) {
			if (display_index >= first_display_row && display_index < first_display_row + anchor.rows) {
				spans.push({ from_col: anchor.col, to_col: anchor.col + anchor.cols });
			}

			if (display_index === first_display_row) {
				spans.push({ from_col: anchor.col, to_col: anchor.col + anchor.anchor_cols });
			}
		}

		return spans;
	}

	// blits one prepared glyph row to the screen
	private blitRow(glyphs: Glyphs, row: number, col: number): void {
		this.terminal.blit(
			glyphs,
			{ row: 0, col: 0, rows: 1, cols: glyphs.cols },
			{ row, col, rows: 1, cols: glyphs.cols }
		);
	}

	// a copy of the display row's glyph row: whitespace in image regions
	// zeroed, plus the optional invert span (selection or cursor)
	private preparedRowAt(display_row: DisplayRow, invert: InvertSpan): Glyphs {
		const { layout } = this.dependencies;
		const first = layout.firstRowOfLine[display_row.line] ?? 0;
		const display_index = first + display_row.row_in_line;
		const glyphs = layout.grid(display_row.line);

		return preparedRow(glyphs, display_row.row_in_line, this.blankSpansAt(display_index), invert);
	}

	// the fake visual selection: inverted cells over the drag range
	private drawSelection(usable: number): void {
		const { editor, layout, viewport } = this.dependencies;
		const selection = editor.selection;

		if (selection === null) {
			return;
		}

		const forward = selection.anchor.before(selection.head);
		const start = forward ? selection.anchor : selection.head;
		const end = forward ? selection.head : selection.anchor;

		const start_visible = layout.bufferToScreen(start);
		const end_visible = layout.bufferToScreen(end);
		const first = layout.firstRowOfLine;
		const first_display_row = (first[start.line] ?? 0) + start_visible.row;
		const last_display_row = (first[end.line] ?? 0) + end_visible.row;
		const display = layout.displayRows;

		for (let display_index = first_display_row; display_index <= last_display_row; display_index++) {
			const display_row = display[display_index];

			if (display_row === undefined) {
				break;
			}

			const screen_row = display_index - viewport.top;

			if (screen_row < 0 || screen_row >= usable) {
				continue;
			}

			const row_length = layout.visibleLength(display_row.line, display_row.row_in_line);
			const from_col = display_index === first_display_row ? start_visible.col : 0;

			// rows fully inside the selection highlight across the width, as
			// vi highlights blank lines in full
			const full_width = Math.max(row_length, layout.wrapWidth);
			const to_col = display_index === last_display_row ? end_visible.col + 1 : full_width;

			const prepared = this.preparedRowAt(display_row, {
				from_col,
				to_col,
				blank_bg: SELECTION_BG,
			});

			this.blitRow(prepared, screen_row, this.dependencies.pad_cols);
		}
	}

	// the cursor is an inverted cell at its screen position, hidden while
	// the command line is open
	private drawCursor(usable: number): void {
		const { editor, layout, viewport } = this.dependencies;

		if (editor.mode === "command_line") {
			return;
		}

		const visible = layout.bufferToScreen(editor.cursor.pos);
		const display_index = (layout.firstRowOfLine[editor.cursor.pos.line] ?? 0) + visible.row;
		const screen_row = display_index - viewport.top;

		if (screen_row < 0 || screen_row >= usable) {
			return;
		}

		const prepared = this.preparedRowAt({ line: editor.cursor.pos.line, row_in_line: visible.row }, {
			from_col: visible.col,
			to_col: visible.col + 1,
			blank_bg: CURSOR_BG,
		});

		// one cell only: a full-row blit would erase the selection
		// overlay beneath the cursor
		this.terminal.blit(
			prepared,
			{ row: 0, col: visible.col, rows: 1, cols: 1 },
			{ row: screen_row, col: this.dependencies.pad_cols + visible.col, rows: 1, cols: 1 }
		);
	}

	private drawLinks(usable: number): void {
		const { layout, viewport } = this.dependencies;
		const first = layout.firstRowOfLine;

		for (const anchor of layout.links()) {
			const display_index = (first[anchor.line] ?? 0) + anchor.row_in_line;
			const screen_row = display_index - viewport.top;

			if (screen_row < 0 || screen_row >= usable) {
				continue;
			}

			const [text = "", url = text] = (anchor.options ?? "").split("|");
			const key = anchor.options ?? "";
			let link = this.links.get(key);

			if (link === undefined) {
				link = new Link(this.terminal, text, url);
				this.links.set(key, link);
			}

			const glyphs = link.update(screen_row, anchor.col + this.dependencies.pad_cols);

			this.blitRow(glyphs, screen_row, anchor.col + this.dependencies.pad_cols);
		}
	}

	private drawStatus(): void {
		const canvas = this.terminal.canvas;
		const status_row = this.terminal.detail_text.length > 0 ? canvas.rows - 2 : canvas.rows - 1;
		const status = textGlyphs(this.statusText(), canvas.cols, false);

		this.blitRow(status, status_row, 0);
	}

	private statusText(): string {
		const editor = this.dependencies.editor;

		if (editor.command_line !== null) {
			return `\\F3${editor.command_line.prompt}${escapeText(editor.command_line.text)}`;
		}

		if (editor.message !== null) {
			return `\\F1${escapeText(editor.message)}`;
		}

		const position = editor.cursor.pos;
		const total = editor.buffer.lineCount();
		const percent = Math.round(((position.line + 1) / Math.max(1, total)) * 100);
		const modified = editor.buffer.modified ? " [Modified]" : "";
		const pending = editor.pending !== null ? "-- pending -- " : "";
		let insert_mode = "";

		if (editor.mode === "insert") {
			insert_mode = "-- INSERT -- ";
		} else if (editor.mode === "replace") {
			insert_mode = "-- REPLACE -- ";
		}

		const filename = `\\F0 "${this.dependencies.filename}"${modified}`;
		const ruler = `\\f7${position.line + 1},${position.col + 1} -- ${total} lines -- ${percent}%`;

		return `${filename} ${insert_mode}${pending}${ruler}`;
	}

	// image regions composite under the text: the texture paints the canvas,
	// then the terminal's text cells draw over it while blank cells stay
	// transparent
	private drawImages(usable: number): void {
		const { viewport, textures } = this.dependencies;
		const canvas = this.terminal.canvas;

		for (const { anchor, first_display_row } of this.frame_regions) {
			const screen_row = first_display_row - viewport.top;
			const screen_col = anchor.col + this.dependencies.pad_cols;

			if (screen_row >= canvas.rows || screen_row + anchor.rows <= 0 || screen_col >= canvas.cols) {
				continue;
			}

			const texture = textures.get(anchor.name);

			if (texture === undefined) {
				continue;
			}

			const texture_glyphs = this.textureGlyphsFor(anchor.name, anchor.rows, anchor.cols);
			const first_row = Math.max(0, -screen_row);
			const first_col = Math.max(0, -screen_col);
			const last = Math.min(anchor.rows, usable - screen_row, canvas.rows - screen_row);
			const rows = last - first_row;
			const cols = Math.min(anchor.cols - first_col, canvas.cols - (screen_col + first_col));

			if (rows <= 0 || cols <= 0) {
				continue;
			}

			const slice = sliceTextureGlyphs(texture_glyphs, first_row, first_col, rows, cols);

			this.renderer.draw(slice, texture, {
				row: screen_row + first_row,
				col: screen_col + first_col,
				rows,
				cols,
			});
		}
	}


	private textureGlyphsFor(name: string, rows: number, cols: number): TexGlyphs {
		const cached = this.texture_glyphs.get(name);

		if (cached !== undefined && cached.rows === rows && cached.cols === cols) {
			return cached;
		}

		const built = textureGlyphs(rows, cols, TexGlyphMode.SAMPLE);
		this.texture_glyphs.set(name, built);
		return built;
	}
}

function escapeText(text: string): string {
	return text.replaceAll("\\", "\\\\");
}
