import VERTEX_SHADER from "./shaders/renderer.vert" with { type: "text" };
import FRAGMENT_SHADER from "./shaders/renderer.frag" with { type: "text" };

import {
	TEXTURES,
	GLYPH_ATLAS_TEXTURE_INDEX,
	GLYPH_ATLAS_TEXTURE,
	PROGRAM_TEXTURE_INDEX,
	loadTextures
} from "./textures.ts";
import { ProgramManager } from "./program_manager.ts";
import { PALETTE } from "./colour.ts";
import { compileProgram, getAttribLocations, getUniformLocations } from "./program.ts";
import { Canvas } from "./canvas.ts";

class Renderer {
	// each vertex is stored in the vertex buffer like so:
	// 2. uint a_bg_colour (1 byte)
	// 3. uint a_fg_colour (1 byte)
	// 4. uint a_char_code (2 bytes)
	// total/stride: 4 bytes
	static readonly STRIDE = 4;

	private canvas: Canvas;
	private gl_program: WebGLProgram;

	private attributes: Record<string, number>;
	private uniforms: Record<string, WebGLUniformLocation>;

	private palette: Float32Array;

	private program: ProgramManager;

	private vbo: WebGLBuffer;
	private count: number;

	private program_row: number;
	private program_col: number;
	private program_rows: number;
	private program_cols: number;

	constructor(canvas: Canvas) {
		this.canvas = canvas;
	}

	async init() {
		const gl = this.canvas.gl;

		this.gl_program = compileProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);

		this.attributes = getAttribLocations(gl, this.gl_program, {
			bg_colour: "a_bg_colour",
			fg_colour: "a_fg_colour",
			char_code: "a_char_code"
		});

		this.uniforms = getUniformLocations(gl, this.gl_program, {
			rows: "u_rows",
			cols: "u_cols",
			program_row: "u_program_row",
			program_col: "u_program_col",
			program_rows: "u_program_rows",
			program_cols: "u_program_cols",
			glyph_atlas: "u_glyph_atlas",
			program: "u_program",
			palette: "u_palette"
		});

		this.vbo = gl.createBuffer();

		if (!this.vbo) {
			throw new Error("When creating vertex buffer");
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

		await loadTextures(gl);

		this.palette = new Float32Array(PALETTE.map((e) => e / 0xff));

		gl.useProgram(this.gl_program);
		gl.uniform1i(this.uniforms.rows, this.canvas.rows);
		gl.uniform1i(this.uniforms.cols, this.canvas.cols);
		gl.uniform1i(this.uniforms.program_row, this.program_row);
		gl.uniform1i(this.uniforms.program_col, this.program_col);
		gl.uniform1i(this.uniforms.program_rows, this.program_rows);
		gl.uniform1i(this.uniforms.program_cols, this.program_cols);
		gl.uniform1i(this.uniforms.glyph_atlas, GLYPH_ATLAS_TEXTURE_INDEX);
		gl.uniform1i(this.uniforms.program, PROGRAM_TEXTURE_INDEX);
		gl.uniform3fv(this.uniforms.palette, this.palette);

		this.count = this.canvas.rows * this.canvas.cols * 6;

		this.canvas.addEventListener("resize", () => {
			this.resize();
		});

		this.program = new ProgramManager(gl);
		this.program.init();
		this.program.resize(this.program_cols, this.program_rows);
		this.program.which = "earth";
	}

	enableAttributes() {
		const gl = this.canvas.gl;

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

		// each vertex is stored in the vertex buffer like so:
		// 2. uint a_bg_colour (1 byte) [offset: 0]
		// 3. uint a_fg_colour (1 byte) [offset: 1]
		// 4. uint a_char_code (2 bytes) [offset: 2]
		// total/stride: 4 bytes

		// bg_colour
		gl.vertexAttribIPointer(this.attributes.bg_colour, 1, gl.UNSIGNED_BYTE, Renderer.STRIDE, 0);
		gl.enableVertexAttribArray(this.attributes.bg_colour);

		// fg_colour
		gl.vertexAttribIPointer(this.attributes.fg_colour, 1, gl.UNSIGNED_BYTE, Renderer.STRIDE, 1);
		gl.enableVertexAttribArray(this.attributes.fg_colour);

		// char_code
		gl.vertexAttribIPointer(this.attributes.char_code, 1, gl.UNSIGNED_SHORT, Renderer.STRIDE, 2);
		gl.enableVertexAttribArray(this.attributes.char_code);
	}

	resize() {
		const gl = this.canvas.gl;
		gl.useProgram(this.gl_program);
		gl.uniform1i(this.uniforms.rows, this.canvas.rows);
		gl.uniform1i(this.uniforms.cols, this.canvas.cols);
		this.count = this.canvas.rows * this.canvas.cols * 6;
	}

	resizeProgram(row: number, col: number, rows: number, cols: number) {
		if (
			row !== this.program_row ||
			col !== this.program_col ||
			rows !== this.program_rows ||
			cols !== this.program_cols
		) {
			this.program_row = row;
			this.program_col = col;
			this.program_rows = rows;
			this.program_cols = cols;

			// update program uniforms
			const gl = this.canvas.gl;
			gl.useProgram(this.gl_program);
			gl.uniform1i(this.uniforms.program_row, row);
			gl.uniform1i(this.uniforms.program_col, col);
			gl.uniform1i(this.uniforms.program_rows, rows);
			gl.uniform1i(this.uniforms.program_cols, cols);

			// resize program texture
			this.program.resize(cols, rows);
		}
	}

	setData(data: Uint32Array) {
		const gl = this.canvas.gl;
		gl.useProgram(this.gl_program);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
	}

	draw() {
		if (this.program_rows > 0 && this.program_cols > 0) {
			// render the internal program first
			this.program.draw();
		}

		const gl = this.canvas.gl;

		// use renderer program
		gl.useProgram(this.gl_program);

		this.enableAttributes();

		// clear the canvas
		const bg = 16 * 3;
		gl.clearColor(this.palette[bg], this.palette[bg + 1], this.palette[bg + 2], 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.activeTexture(gl.TEXTURE0 + GLYPH_ATLAS_TEXTURE_INDEX);
		gl.bindTexture(gl.TEXTURE_2D, TEXTURES[GLYPH_ATLAS_TEXTURE]);
		gl.activeTexture(gl.TEXTURE0 + PROGRAM_TEXTURE_INDEX);
		gl.bindTexture(gl.TEXTURE_2D, this.program.texture);

		// render to the canvas
		gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		gl.drawArrays(gl.TRIANGLES, 0, this.count);

		// Unbind the program texture to prevent feedback loops in the next frame
		gl.activeTexture(gl.TEXTURE0 + PROGRAM_TEXTURE_INDEX);
		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}
}

export { Renderer };
