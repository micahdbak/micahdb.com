import * as tscon from "@micahdb/tscon";
import { Link } from "@/components/link.ts";
import type { Editor } from "./editor/editor.ts";
import type { DisplayRow, ImageAnchor, Layout } from "./layout.ts";
import type { Viewport } from "./viewport.ts";

const TILDE = new tscon.Glyphs("\\F0~", 1, { wrap: tscon.Wrap.TRUNCATE });
const TILDE_AT = { row: 0, col: 0, rows: 1, cols: 1 };

const CURSOR_BG = tscon.Colour.WHITE;
const BAR_COLOUR = tscon.Colour.BRIGHT_BLACK;
const BAR_COLUMN = 80;

// CP437 vertical line; blank cells in the bar column draw it rather than fill
// a background many steps brighter than Neovim's bar
const BAR_GLYPH = 0xb3;

export type ViewDependencies = {
	editor: Editor;
	layout: Layout;
	viewport: Viewport;
	textures: Map<string, WebGLTexture>;
	image_modes: Record<string, tscon.TexGlyphMode>;
	pad_cols: number;
	filename: string;
};

type InvertSpan = { from_col: number; to_col: number; blank_bg: number } | null;

type ImageRegion = { anchor: ImageAnchor; first_display_row: number };

// the column bar sits behind whatever text is in the column
function barCell(cell: number): number {
	if (cell === 0 || (cell & 0xff) === 32) {
		return BAR_COLOUR << 12 | BAR_GLYPH;
	}

	return cell & 0xf0ff | BAR_COLOUR << 8;
}

// swap the fg (bits 12-15) and bg (bits 8-11) nibbles; a blank sentinel
// paints as a solid block
function invertedCell(cell: number, blank_bg: number): number {
	if (cell === 0) {
		return (tscon.Colour.BLACK << 12) | (blank_bg << 8) | 32;
	}

	const fg = (cell >> 12) & 0xf;
	const bg = (cell >> 8) & 0xf;

	return (bg << 12) | (fg << 8) | (cell & 0xff);
}

/**
 * Renders one frame: the visible slice of display rows, the tilde rows past
 * the end of the buffer, the cursor overlay, the links, the status / command
 * line, then the image regions under the text, and finally the terminal
 * frame -- text draws over images, and blank cells stay transparent so the
 * textures show through.
 */
export class View {
	private readonly links: Link[] = [];
	private readonly texture_glyphs = new Map<string, tscon.TexGlyphs>();
	private frame_regions: ImageRegion[] = [];
	private frame_bar_col: number | null = null;

	constructor(
		private readonly terminal: tscon.Terminal,
		private readonly renderer: tscon.Renderer,
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

		this.drawCursor(usable);
		this.drawLinks(usable);
		this.drawStatus();
		this.drawImages();
		this.terminal.draw();
	}

	// blits one prepared row of a line grid to the screen
	private blitRow(glyphs: tscon.Glyphs, row_in_line: number, screen_row: number, col: number): void {
		this.terminal.blit(
			glyphs,
			{ row: row_in_line, col: 0, rows: 1, cols: glyphs.cols },
			{ row: screen_row, col, rows: 1, cols: glyphs.cols }
		);
	}

	/**
	 * A copy of the display row's line grid with the optional invert span
	 * (the cursor) and the column bar painted into its row
	 */
	private preparedRowAt(display_row: DisplayRow, invert: InvertSpan): tscon.Glyphs {
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

		// one cell only: the rest of the prepared row is not part of the cursor
		this.terminal.blit(
			prepared,
			{ row: visible.row, col: visible.col, rows: 1, cols: 1 },
			{ row: screen_row, col: this.dependencies.pad_cols + visible.col, rows: 1, cols: 1 }
		);
	}

	private drawLinks(usable: number): void {
		const { layout, viewport } = this.dependencies;
		const first = layout.firstRowOfLine;
		const pad = this.dependencies.pad_cols;
		const anchors = layout.links();

		for (const [index, anchor] of anchors.entries()) {
			const [text = "", url = text] = (anchor.options ?? "").split("|");
			let link = this.links[index];

			if (link === undefined || link.text !== text || link.url !== url) {
				link = new Link(this.terminal, text, url);
				this.links[index] = link;
			}

			const line = layout.grid(anchor.line);
			const line_screen_row = (first[anchor.line] ?? 0) - viewport.top;
			const glyphs = link.update(line, anchor.index, line_screen_row, pad);

			for (const span of link.spans) {
				const screen_row = line_screen_row + span.row;

				if (screen_row < 0 || screen_row >= usable) {
					continue;
				}

				this.terminal.blit(
					glyphs,
					{ row: span.row, col: span.from, rows: 1, cols: span.to - span.from },
					{
						row: screen_row,
						col: pad + span.from,
						rows: 1,
						cols: span.to - span.from
					}
				);
			}
		}

		this.links.length = anchors.length;
	}

	private drawStatus(): void {
		const canvas = this.terminal.canvas;
		const status_row = this.terminal.detail_text.length > 0 ? canvas.rows - 2 : canvas.rows - 1;
		const status = new tscon.Glyphs(this.statusText(), canvas.cols, { wrap: tscon.Wrap.TRUNCATE });

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
	private drawImages(): void {
		const { viewport, textures } = this.dependencies;
		const canvas = this.terminal.canvas;

		for (const { anchor, first_display_row } of this.frame_regions) {
			const screen_row = first_display_row - viewport.top;
			const screen_col = anchor.col + this.dependencies.pad_cols;

			// entirely off screen: nothing to draw
			if (screen_row >= canvas.rows || screen_row + anchor.rows <= 0 || screen_col >= canvas.cols) {
				continue;
			}

			const texture = textures.get(anchor.name);

			if (texture === undefined) {
				continue;
			}

			/**
			 * The whole region is drawn every frame, even when it extends
			 * past the canvas: the shader clips the off-screen cells, and
			 * the packed row/column indices must stay whole for the UV
			 * mapping to sample the right part of the texture. The text
			 * (drawn after) covers any part that reaches the status row.
			 */
			this.renderer.draw(
				this.textureGlyphsFor(anchor.name, anchor.rows, anchor.cols),
				texture,
				{
					row: screen_row,
					col: screen_col,
					rows: anchor.rows,
					cols: anchor.cols,
				}
			);
		}
	}


	private textureGlyphsFor(name: string, rows: number, cols: number): tscon.TexGlyphs {
		const mode = this.dependencies.image_modes[name] ?? tscon.TexGlyphMode.SAMPLE;
		const key = `${name}:${mode}`;
		const cached = this.texture_glyphs.get(key);

		if (cached !== undefined && cached.rows === rows && cached.cols === cols) {
			return cached;
		}

		const built = tscon.textureGlyphs(rows, cols, mode);
		this.texture_glyphs.set(key, built);
		return built;
	}
}

function escapeText(text: string): string {
	return text.replaceAll("\\", "\\\\");
}
