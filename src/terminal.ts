import { Canvas } from "./canvas.ts";
import { Renderer } from "./renderer.ts";
import { Glyph } from "./glyph.ts";
import { Colour } from "./colour.ts";

class Terminal {
	static readonly BYTES_PER_GLYPH = Glyph.VERTICES * Renderer.STRIDE;
	static readonly UINT32_PER_GLYPH = Glyph.VERTICES;

	private renderer: Renderer;

	private data: Uint32Array;

	public canvas: Canvas;

	public detail_text: string = "";

	constructor(canvas: Canvas) {
		this.canvas = canvas;
		this.renderer = new Renderer(canvas);

		this.resize();

		canvas.addEventListener("resize", () => {
			this.resize();
		});
	}

	async init() {
		await this.renderer.init();
	}

	resize() {
		const count =
			this.canvas.rows * this.canvas.cols * Terminal.UINT32_PER_GLYPH;
		this.data = new Uint32Array(count);
	}

	resizeProgram(row: number, col: number, rows: number, cols: number) {
		this.renderer.resizeProgram(row, col, rows, cols);
	}

	clear() {
		this.data.fill(0);
		document.body.className = "";
	}

	drawText(
		text: string,
		row: number,
		col: number,
		fg_colour: Colour,
		bg_colour: Colour = Colour.BG,
		fontOffset: number = Glyph.NORMAL_FONT
	) {
		row = Math.round(row);
		col = Math.round(col);

		let r = row;
		let c = col;
		let i = 0;

		while (r < this.canvas.rows && i < text.length) {
			const char_code = text.charCodeAt(i);
			const bg = bg_colour;
			const fg = fg_colour;

			if (char_code === "\n".charCodeAt(0)) {
				c = col;
				r++;
				i++;
				continue;
			}

			if (char_code === "\t".charCodeAt(0)) {
				c += 4;
				i++;
				continue;
			}

			if (c >= 0 && c < this.canvas.cols && r >= 0 && r < this.canvas.rows) {
				const glyph_index = r * this.canvas.cols + c;
				const uint32_index = glyph_index * Terminal.UINT32_PER_GLYPH;

				const off = char_code < 33 ? 0 : fontOffset;
				const glyph = new Glyph(bg, fg, char_code + off);

				this.data.set(glyph.data(), uint32_index);
			}

			c++;
			i++;
		}
	}

	draw() {
		let mr = this.canvas.mouse_row;
		let mc = this.canvas.mouse_col;

		// highlight mouse cursor
		if (mc !== undefined && mr !== undefined) {
			mr = Math.max(0, Math.min(this.canvas.rows - 1, mr));
			mc = Math.max(0, Math.min(this.canvas.cols - 1, mc));

			const glyph_index = mr * this.canvas.cols + mc;
			const uint32_index = glyph_index * Terminal.UINT32_PER_GLYPH;

			const cell_data = this.data.subarray(
				uint32_index,
				uint32_index + Terminal.UINT32_PER_GLYPH
			);

			const glyph = Glyph.fromData(cell_data);

			if (this.canvas.mouse_down) {
				glyph.bg_colour = Colour.RED;
				glyph.fg_colour = Colour.LIGHT_BLUE;
			} else {
				const bg_colour = glyph.bg_colour;
				glyph.bg_colour = glyph.fg_colour;
				glyph.fg_colour = bg_colour;
			}

			if (glyph.bg_colour === glyph.fg_colour) {
				if (glyph.bg_colour < Colour.WHITE) {
					glyph.bg_colour = Colour.WHITE;
				} else {
					glyph.bg_colour = Colour.BLACK;
				}
			}

			this.data.set(glyph.data(), uint32_index);
		}

		this.canvas.mouse_click = false;

		if (this.detail_text.length > 0) {
			this.drawText(
				this.detail_text,
				this.canvas.rows - 1,
				Colour.BLACK,
				Colour.WHITE
			);
			this.detail_text = "";
		}

		this.renderer.setData(this.data);
		this.renderer.draw();
	}
}

export { Terminal };
