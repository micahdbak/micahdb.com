import VERTEX_SHADER from "./renderer.vert" with { type: "text" };
import FRAGMENT_SHADER from "./renderer.frag" with { type: "text" };

import {
	TEXTURES,
	GLYPH_ATLAS_TEXTURE_INDEX,
	GLYPH_ATLAS_TEXTURE,
	PROGRAM_TEXTURE_INDEX,
	loadTextures
} from "./textures.ts";
import { ProgramManager } from "./program_manager.ts";

class Renderer {
	// each vertex is stored in the vertex buffer like so:
	// 2. uint a_bgColour (1 byte)
	// 3. uint a_fgColour (1 byte)
	// 4. uint a_charCode (2 bytes)
	// total/stride: 4 bytes
	static readonly STRIDE = 4;

	private gl: WebGL2RenderingContext;
	private glProgram: WebGLProgram;

	private attributes: {
		bgColour: number;
		fgColour: number;
		charCode: number;
	};

	private uniforms: {
		rows: WebGLUniformLocation;
		cols: WebGLUniformLocation;
		programRow: WebGLUniformLocation;
		programCol: WebGLUniformLocation;
		programRows: WebGLUniformLocation;
		programCols: WebGLUniformLocation;
		glyphAtlas: WebGLUniformLocation;
		program: WebGLUniformLocation;
		palette: WebGLUniformLocation;
	};

	private logMessage: (source: string, message: string) => void;

	private program: ProgramManager;

	private vbo: WebGLBuffer;
	private count: number;

	private palette: Float32Array;

	private canvasWidth: number;
	private canvasHeight: number;

	private rows: number;
	private cols: number;
	private programRow: number;
	private programCol: number;
	private programRows: number;
	private programCols: number;

	public canvas: HTMLCanvasElement;

	constructor(
		canvas: HTMLCanvasElement,
		logMessage: (source: string, message: string) => void
	) {
		this.canvas = canvas;

		const gl: WebGL2RenderingContext | null = this.canvas.getContext("webgl2");
		if (!gl) {
			window.location.href = "./about.html";
			return;
		}

		this.gl = gl;

		this.rows = 1;
		this.cols = 1;
		this.programRow = 0;
		this.programCol = 0;
		this.programRows = 1;
		this.programCols = 1;

		this.logMessage = logMessage;
	}

	async init() {
		this.initializeProgram();
		this.initializeLocations();
		this.initializeVBO();

		await loadTextures(this.gl, this.logMessage);

		this.gl.uniform1i(this.uniforms.glyphAtlas, GLYPH_ATLAS_TEXTURE_INDEX);

		this.gl.uniform1i(this.uniforms.rows, this.rows);
		this.gl.uniform1i(this.uniforms.cols, this.cols);

		this.gl.uniform1i(this.uniforms.programRow, this.programRow);
		this.gl.uniform1i(this.uniforms.programCol, this.programCol);
		this.gl.uniform1i(this.uniforms.programRows, this.programRows);
		this.gl.uniform1i(this.uniforms.programCols, this.programCols);

		this.program = new ProgramManager(this.gl, this.logMessage);
		this.program.init();
		this.program.which = "earth";
	}

	initializeProgram() {
		const vertShader = this.gl.createShader(this.gl.VERTEX_SHADER);
		if (!vertShader) {
			throw new Error("When creating vertex shader");
		}

		this.gl.shaderSource(vertShader, VERTEX_SHADER);
		this.gl.compileShader(vertShader);
		if (!this.gl.getShaderParameter(vertShader, this.gl.COMPILE_STATUS)) {
			throw new Error(
				"When compiling vertex shader: " + this.gl.getShaderInfoLog(vertShader)
			);
		}

		const fragShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
		if (!fragShader) {
			throw new Error("When creating fragment shader");
		}

		this.gl.shaderSource(fragShader, FRAGMENT_SHADER);
		this.gl.compileShader(fragShader);
		if (!this.gl.getShaderParameter(fragShader, this.gl.COMPILE_STATUS)) {
			throw new Error(
				"When compiling fragment shader: " +
					this.gl.getShaderInfoLog(fragShader)
			);
		}

		const glProgram = this.gl.createProgram();
		if (!glProgram) {
			throw new Error("When creating GPU glProgram");
		}

		this.glProgram = glProgram;

		this.gl.attachShader(this.glProgram, vertShader);
		this.gl.attachShader(this.glProgram, fragShader);
		this.gl.linkProgram(this.glProgram);
		if (!this.gl.getProgramParameter(this.glProgram, this.gl.LINK_STATUS)) {
			throw new Error(
				"When linking shader program: " +
					this.gl.getProgramInfoLog(this.glProgram)
			);
		}

		this.gl.useProgram(this.glProgram);
	}

	initializeLocations() {
		// store attribute locations
		this.attributes = {
			bgColour: this.gl.getAttribLocation(this.glProgram, "a_bgColour"),
			fgColour: this.gl.getAttribLocation(this.glProgram, "a_fgColour"),
			charCode: this.gl.getAttribLocation(this.glProgram, "a_charCode")
		};

		if (
			this.attributes.bgColour < 0 ||
			this.attributes.fgColour < 0 ||
			this.attributes.charCode < 0
		) {
			throw new Error("When getting attribute locations");
		}

		const rows = this.gl.getUniformLocation(this.glProgram, "u_rows");
		const cols = this.gl.getUniformLocation(this.glProgram, "u_cols");
		const programRow = this.gl.getUniformLocation(
			this.glProgram,
			"u_program_row"
		);
		const programCol = this.gl.getUniformLocation(
			this.glProgram,
			"u_program_col"
		);
		const programRows = this.gl.getUniformLocation(
			this.glProgram,
			"u_program_rows"
		);
		const programCols = this.gl.getUniformLocation(
			this.glProgram,
			"u_program_cols"
		);
		const glyphAtlas = this.gl.getUniformLocation(
			this.glProgram,
			"u_glyphAtlas"
		);
		const program = this.gl.getUniformLocation(this.glProgram, "u_program");
		const palette = this.gl.getUniformLocation(this.glProgram, "u_palette");

		if (
			!rows ||
			!cols ||
			!programRow ||
			!programCol ||
			!programRows ||
			!programCols ||
			!glyphAtlas ||
			!program ||
			!palette
		) {
			throw new Error("When getting uniform locations");
		}

		this.gl.uniform1i(program, PROGRAM_TEXTURE_INDEX);

		// store uniform locations
		this.uniforms = {
			rows,
			cols,
			programRow,
			programCol,
			programRows,
			programCols,
			glyphAtlas,
			program,
			palette
		};
	}

	initializeVBO() {
		this.vbo = this.gl.createBuffer();
		if (!this.vbo) {
			throw new Error("When creating vertex buffer");
		}

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
	}

	async initializeTextures() {}

	enableAttributes() {
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);

		// each vertex is stored in the vertex buffer like so:
		// 2. uint a_bgColour (1 byte) [offset: 0]
		// 3. uint a_fgColour (1 byte) [offset: 1]
		// 4. uint a_charCode (2 bytes) [offset: 2]
		// total/stride: 4 bytes

		// bgColour
		this.gl.vertexAttribIPointer(
			this.attributes.bgColour,
			1,
			this.gl.UNSIGNED_BYTE,
			Renderer.STRIDE,
			0
		);
		this.gl.enableVertexAttribArray(this.attributes.bgColour);

		// fgColour
		this.gl.vertexAttribIPointer(
			this.attributes.fgColour,
			1,
			this.gl.UNSIGNED_BYTE,
			Renderer.STRIDE,
			1
		);
		this.gl.enableVertexAttribArray(this.attributes.fgColour);

		// charCode
		this.gl.vertexAttribIPointer(
			this.attributes.charCode,
			1,
			this.gl.UNSIGNED_SHORT,
			Renderer.STRIDE,
			2
		);
		this.gl.enableVertexAttribArray(this.attributes.charCode);
	}

	resize(
		canvasWidth: number,
		canvasHeight: number,
		rows: number,
		cols: number,
		vrow: number,
		vcol: number,
		vrows: number,
		vcols: number
	) {
		// update canvas size
		this.canvas.width = canvasWidth;
		this.canvas.height = canvasHeight;
		this.canvasWidth = canvasWidth;
		this.canvasHeight = canvasHeight;

		// set GL program to renderer
		this.gl.useProgram(this.glProgram);

		if (rows !== this.rows || cols !== this.cols) {
			this.rows = rows;
			this.cols = cols;

			// update uniforms
			this.gl.uniform1i(this.uniforms.rows, rows);
			this.gl.uniform1i(this.uniforms.cols, cols);

			// set count to the number of vertices
			this.count = rows * cols * 6;
		}

		if (
			vrow !== this.programRow ||
			vcol !== this.programCol ||
			vrows !== this.programRows ||
			vcols !== this.programCols
		) {
			this.programRow = vrow;
			this.programCol = vcol;
			this.programRows = vrows;
			this.programCols = vcols;

			// update program uniforms
			this.gl.uniform1i(this.uniforms.programRow, vrow);
			this.gl.uniform1i(this.uniforms.programCol, vcol);
			this.gl.uniform1i(this.uniforms.programRows, vrows);
			this.gl.uniform1i(this.uniforms.programCols, vcols);

			// resize program
			this.program.resize(vcols, vrows);
		}
	}

	setData(data: Uint32Array) {
		this.gl.useProgram(this.glProgram);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.DYNAMIC_DRAW);
	}

	setPalette(palette: Float32Array) {
		this.gl.useProgram(this.glProgram);
		this.gl.uniform3fv(this.uniforms.palette, palette);
		this.palette = palette;
	}

	draw() {
		if (this.canvas.width === 0 || this.canvas.height === 0) {
			return;
		}

		if (this.programRows > 0 && this.programCols > 0) {
			// render the internal program first
			this.program.draw();
		}

		// use renderer program
		this.gl.useProgram(this.glProgram);

		this.enableAttributes();

		// clear the canvas
		const bg = 16 * 3;
		this.gl.clearColor(
			this.palette[bg],
			this.palette[bg + 1],
			this.palette[bg + 2],
			1.0
		);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);

		this.gl.activeTexture(this.gl.TEXTURE0 + GLYPH_ATLAS_TEXTURE_INDEX);
		this.gl.bindTexture(this.gl.TEXTURE_2D, TEXTURES[GLYPH_ATLAS_TEXTURE]);
		this.gl.activeTexture(this.gl.TEXTURE0 + PROGRAM_TEXTURE_INDEX);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.program.texture);

		// render to the canvas
		this.gl.viewport(0, 0, this.canvasWidth, this.canvasHeight);
		this.gl.drawArrays(this.gl.TRIANGLES, 0, this.count);

		// Unbind the program texture to prevent feedback loops in the next frame
		this.gl.activeTexture(this.gl.TEXTURE0 + PROGRAM_TEXTURE_INDEX);
		this.gl.bindTexture(this.gl.TEXTURE_2D, null);
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
	}
}

export { Renderer };
