import VERTEX_SHADER from "./shaders/terminal.vert" with { type: "text" };
import FRAGMENT_SHADER from "./shaders/terminal.frag" with { type: "text" };

import { BITMAP_FONT_TEXTURE_INDEX } from "./textures.ts";
import { PALETTE } from "./colour.ts";

import { Canvas } from "./canvas.ts";
import { Glyphs, GlyphRect } from "./glyphs.ts";

import { compileProgram, getAttribLocations, getUniformLocations } from "./program.ts";
import { loadModernDosTexture } from "./moderndos.ts";

export class Terminal {
	private gl_program: WebGLProgram;

	private attributes: Record<string, number>;
	private uniforms: Record<string, WebGLUniformLocation>;

	private palette: Float32Array;

	private vao: WebGLVertexArrayObject;
	private vbo: WebGLBuffer;

	// framebuffer of console characters
	private fbcon: Uint32Array;

	private bitmap_font: WebGLTexture;

	public canvas: Canvas;

	constructor(canvas: Canvas) {
		this.canvas = canvas;
		const gl = canvas.gl;

		this.gl_program = compileProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);

		this.attributes = getAttribLocations(gl, this.gl_program, {
			colour: "a_colour",
			char_code: "a_char_code"
		});

		this.uniforms = getUniformLocations(gl, this.gl_program, {
			rows: "u_rows",
			cols: "u_cols",
			mouse_row: "u_mouse_row",
			mouse_col: "u_mouse_col",
			palette: "u_palette",
			bitmap_font: "u_bitmap_font"
		});

		const vao = gl.createVertexArray();
		this.vao = vao;

		if (!vao) {
			throw new Error("Could not create vertex array object");
		}

		gl.bindVertexArray(vao);

		const vbo = gl.createBuffer();
		this.vbo = vbo;

		if (!vbo) {
			throw new Error("Could not create vertex buffer");
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

		// every vertex in the VBO is a 32-byte integer split like so:
		// [ (unused) |       a_colour       |   a_char_code    ]
		// [ 16 bits  | 4 bits fg, 4 bits bg | 8 bits char code ]

		// a_colour
		gl.vertexAttribIPointer(this.attributes.colour, 1, gl.UNSIGNED_BYTE, 4, 1);
		gl.vertexAttribDivisor(this.attributes.colour, 1);
		gl.enableVertexAttribArray(this.attributes.colour);

		// a_char_code
		gl.vertexAttribIPointer(this.attributes.char_code, 1, gl.UNSIGNED_BYTE, 4, 0);
		gl.vertexAttribDivisor(this.attributes.char_code, 1);
		gl.enableVertexAttribArray(this.attributes.char_code);

		gl.bindVertexArray(null);

		this.palette = new Float32Array(PALETTE.map((byte) => byte / 0xff));

		gl.useProgram(this.gl_program);
		gl.uniform1i(this.uniforms.rows, this.canvas.rows);
		gl.uniform1i(this.uniforms.cols, this.canvas.cols);
		gl.uniform1i(this.uniforms.mouse_row, -1);
		gl.uniform1i(this.uniforms.mouse_col, -1);
		gl.uniform3fv(this.uniforms.palette, this.palette);
		gl.uniform1i(this.uniforms.bitmap_font, BITMAP_FONT_TEXTURE_INDEX);

		this.fbcon = new Uint32Array(this.canvas.rows * this.canvas.cols);

		this.canvas.addEventListener("resize", () => {
			gl.uniform1i(this.uniforms.rows, this.canvas.rows);
			gl.uniform1i(this.uniforms.cols, this.canvas.cols);
			this.fbcon = new Uint32Array(this.canvas.rows * this.canvas.cols);
		});

		this.bitmap_font = loadModernDosTexture(gl);
	}

	blit(glyphs: Glyphs, src: GlyphRect, dst: GlyphRect) {
		// overflow rows
		if (dst.row + dst.rows > this.canvas.rows) {
			const extra_rows = dst.row + dst.rows - this.canvas.rows;
			dst.rows -= extra_rows;
			src.rows = dst.rows;
		}

		// overflow cols
		if (dst.col + dst.cols > this.canvas.cols) {
			const extra_cols = dst.col + dst.cols - this.canvas.cols;
			dst.cols -= extra_cols;
			src.cols = dst.cols;
			console.log("trimmed: ", dst.cols, src.cols);
		}

		// validate the input rects
		if (
			src.row < 0 ||
			dst.row < 0 ||
			src.row + src.rows > glyphs.rows ||
			dst.row + dst.rows > this.canvas.rows ||
			src.rows !== dst.rows ||
			src.col < 0 ||
			dst.col < 0 ||
			src.col + src.cols > glyphs.cols ||
			dst.col + dst.cols > this.canvas.cols ||
			src.cols !== dst.cols
		) {
			console.log("not blitting due to bad src or dst");
			return;
		}

		for (let row = 0; ; row++) {
			const src_row = row + src.row;
			const dst_row = row + dst.row;

			if (src_row >= src.row + src.rows || dst_row >= dst.row + dst.rows) {
				break;
			}

			const src_idx = src_row * glyphs.cols + src.col;
			const dst_idx = dst_row * this.canvas.cols + dst.col;

			this.fbcon.set(glyphs.data.subarray(src_idx, src_idx + src.cols), dst_idx);
		}
	}

	draw() {
		const gl = this.canvas.gl;
		gl.useProgram(this.gl_program);

		gl.bindVertexArray(this.vao);

		// clear the canvas
		gl.clearColor(this.palette[0], this.palette[1], this.palette[2], 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.viewport(0, 0, this.canvas.width, this.canvas.height);

		// set mouse position uniforms
		gl.uniform1i(this.uniforms.mouse_row, this.canvas.mouse_row);
		gl.uniform1i(this.uniforms.mouse_col, this.canvas.mouse_col);

		// upload glyph data to the GPU
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.bufferData(gl.ARRAY_BUFFER, this.fbcon, gl.DYNAMIC_DRAW);

		// bind and activate the bitmap font
		gl.activeTexture(gl.TEXTURE0 + BITMAP_FONT_TEXTURE_INDEX);
		gl.bindTexture(gl.TEXTURE_2D, this.bitmap_font);

		// draw glyphs: generate 6 vertices (two triangles = one quad) per glyph instance
		gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.canvas.rows * this.canvas.cols);

		gl.bindVertexArray(null);
	}
}
