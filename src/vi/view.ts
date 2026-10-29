import { Colour, Glyphs, TexGlyphMode, Wrap, textureGlyphs } from "@micahdb/tscon";
import type { TexGlyphs, Terminal, Renderer } from "@micahdb/tscon";
import { Link } from "@/components/link.ts";
import type { Editor } from "./editor/editor.ts";
import type { DisplayRow, ImageAnchor, Layout } from "./layout.ts";
import type { Viewport } from "./viewport.ts";

const TILDE = new Glyphs("\\F0~", 1, { wrap: Wrap.TRUNCATE });
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

type InvertSpan = { from_col: number; to_col: number; blank_bg: number } | null;

type ImageRegion = { anchor: ImageAnchor; first_display_row: number };

// the column bar sits behind whatever text is in the column
function barCell(cell: number): number {
	return cell === 0 ? BAR_BG << 8 | 32 : (cell & 0xf0ff) | BAR_BG << 8;
}

// swap the fg (bits 12-15) and bg (bits 8-11) nibbles; a blank sentinel
// paints as a solid block
function invertedCell(cell: number, blank_bg: number): number {
	if (cell === 0) {
		return (Colour.BLACK << 12) | (blank_bg << 8) | 32;
	}

	const fg = (cell >> 12) & 0xf;
	const bg = (cell >> 8) & 0xf;

	return (bg << 12) | (fg << 8) | (cell & 0xff);
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
	private frame_regions: ImageRegion[] = [];
	private frame_bar_col: number | null = null;

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

		/**
		 * The bar marks the classic print margin when the terminal is wide
		 * enough for column 80 to exist
		 */
		this.frame_bar_col = layout.wrapWidth > BAR_COLUMN ? BAR_COLUMN - 1 : null;

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

			this.blitRow(
				this.preparedRowAt(display_row, null),
				display_row.row_in_line,
				row,
				pad
			);
		}

		this.drawSelection(usable);
		this.drawCursor(usable);
		this.drawLinks(usable);
		this.drawStatus();
		this.drawImages(usable);
		this.terminal.draw();
	}

	// blits one prepared row of a line grid to the screen
	private blitRow(glyphs: Glyphs, row_in_line: number, screen_row: number, col: number): void {
		this.terminal.blit(
			glyphs,
			{ row: row_in_line, col: 0, rows: 1, cols: glyphs.cols },
			{ row: screen_row, col, rows: 1, cols: glyphs.cols }
		);
	}

	/**
	 * A copy of the display row's line grid with the optional invert span
	 * (selection or cursor) and the column bar painted into its row
	 */
	private preparedRowAt(display_row: DisplayRow, invert: InvertSpan): Glyphs {
		const glyphs = this.dependencies.layout.grid(display_row.line);
		const row = display_row.row_in_line;
		const bar_col = display_row.row_in_line === 0 ? this.frame_bar_col : null;

		return glyphs.mapCells((cell, _, col) => {
			let painted = cell;

			if (col === bar_col) {
				painted = barCell(painted);
			}

			if (invert !== null && col >= invert.from_col && col < invert.to_col) {
				painted = invertedCell(painted, invert.blank_bg);
			}

			return painted;
		}, { row, col: 0, rows: 1, cols: glyphs.cols });
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

			/**
			 * Rows fully inside the selection highlight across the width, as
			 * vi highlights blank lines in full
			 */
			const full_width = Math.max(row_length, layout.wrapWidth);
			const to_col = display_index === last_display_row ? end_visible.col + 1 : full_width;

			this.blitRow(
				this.preparedRowAt(display_row, {
					from_col,
					to_col,
					blank_bg: SELECTION_BG,
				}),
				display_row.row_in_line,
				screen_row,
				this.dependencies.pad_cols
			);
		}
	}

	/**
	 * The cursor is an inverted cell at its screen position, hidden while
	 * the command line is open
	 */
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

		/**
		 * One cell only: a full-row blit would erase the selection
		 * overlay beneath the cursor
		 */
		this.terminal.blit(
			prepared,
			{ row: visible.row, col: visible.col, rows: 1, cols: 1 },
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

			this.blitRow(glyphs, 0, screen_row, anchor.col + this.dependencies.pad_cols);
		}
	}

	private drawStatus(): void {
		const canvas = this.terminal.canvas;
		const status_row = this.terminal.detail_text.length > 0 ? canvas.rows - 2 : canvas.rows - 1;
		const status = new Glyphs(this.statusText(), canvas.cols, { wrap: Wrap.TRUNCATE });

		this.blitRow(status, 0, status_row, 0);
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

	/**
	 * Image regions composite under the text: the texture paints the canvas,
	 * then the terminal's text cells draw over it while blank cells stay
	 * transparent
	 */
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
