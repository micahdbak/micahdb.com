import VERTEX_SHADER from "./renderer.vert" with { type: "text" };
import FRAGMENT_SHADER from "./renderer.frag" with { type: "text" };

import { Visuals } from "./visuals.ts";
import { CubeVisuals } from "./visuals/cube.ts";

class Renderer {
	// each vertex is stored in the vertex buffer like so:
	// 2. uint a_bgColour (1 byte)
	// 3. uint a_fgColour (1 byte)
	// 4. uint a_charCode (2 bytes)
	// total/stride: 4 bytes
	static readonly STRIDE = 4;

	private gl: WebGL2RenderingContext;
	private program: WebGLProgram;

	private attributes: {
		bgColour: number;
		fgColour: number;
		charCode: number;
	};

	private uniforms: {
		rows: WebGLUniformLocation;
		cols: WebGLUniformLocation;
		glyphAtlas: WebGLUniformLocation;
		offScreen: WebGLUniformLocation;
		palette: WebGLUniformLocation;
	};

	private visuals: Visuals;

	private vbo: WebGLBuffer;
	private count: number;

	private glyphAtlasTexture: WebGLTexture;

	private palette: Float32Array;

	private canvasWidth: number;
	private canvasHeight: number;

	public canvas: HTMLCanvasElement;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;

		const gl: WebGL2RenderingContext | null = this.canvas.getContext("webgl2");
		if (!gl) {
			window.location.href = "./about.html";
			return;
		}

		this.gl = gl;
	}

	async init() {
		this.initializeProgram();
		this.initializeLocations();
		await this.initializeGlyphAtlasTexture();
		this.initializeVBO();

		this.visuals = new CubeVisuals(this.gl);
		await this.visuals.init();
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

		const program = this.gl.createProgram();
		if (!program) {
			throw new Error("When creating GPU program");
		}

		this.program = program;

		this.gl.attachShader(this.program, vertShader);
		this.gl.attachShader(this.program, fragShader);
		this.gl.linkProgram(this.program);
		if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
			throw new Error(
				"When linking shader program: " +
					this.gl.getProgramInfoLog(this.program)
			);
		}

		this.gl.useProgram(this.program);
	}

	initializeLocations() {
		// store attribute locations
		this.attributes = {
			bgColour: this.gl.getAttribLocation(this.program, "a_bgColour"),
			fgColour: this.gl.getAttribLocation(this.program, "a_fgColour"),
			charCode: this.gl.getAttribLocation(this.program, "a_charCode")
		};

		if (
			this.attributes.bgColour < 0 ||
			this.attributes.fgColour < 0 ||
			this.attributes.charCode < 0
		) {
			throw new Error("When getting attribute locations");
		}

		const rows = this.gl.getUniformLocation(this.program, "u_rows");
		const cols = this.gl.getUniformLocation(this.program, "u_cols");
		const glyphAtlas = this.gl.getUniformLocation(this.program, "u_glyphAtlas");
		const offScreen = this.gl.getUniformLocation(this.program, "u_offScreen");
		const palette = this.gl.getUniformLocation(this.program, "u_palette");

		if (!rows || !cols || !glyphAtlas || !offScreen || !palette) {
			throw new Error("When getting uniform locations");
		}

		// bind the offscreen texture to texture 1
		this.gl.uniform1i(offScreen, 1);

		// store uniform locations
		this.uniforms = { rows, cols, glyphAtlas, offScreen, palette };
	}

	async initializeGlyphAtlasTexture() {
		await new Promise((resolve, reject) => {
			const image = new Image();
			image.src = "/glyphatlas.png";
			image.onload = () => {
				const texture = this.gl.createTexture();
				if (!texture) {
					reject(new Error("When creating GL texture"));
					return;
				}

				this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

				// prevent texture halos/outlines from filtering
				this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

				this.gl.texImage2D(
					this.gl.TEXTURE_2D,
					0,
					this.gl.RGBA,
					this.gl.RGBA,
					this.gl.UNSIGNED_BYTE,
					image
				);

				this.gl.generateMipmap(this.gl.TEXTURE_2D);

				this.gl.texParameteri(
					this.gl.TEXTURE_2D,
					this.gl.TEXTURE_MIN_FILTER,
					this.gl.LINEAR_MIPMAP_LINEAR
				);

				this.gl.texParameteri(
					this.gl.TEXTURE_2D,
					this.gl.TEXTURE_MAG_FILTER,
					this.gl.LINEAR
				);

				this.glyphAtlasTexture = texture;

				resolve();
			};
		});

		// bind u_glyphAtlas to texture 0
		this.gl.uniform1i(this.uniforms.glyphAtlas, 0);
	}

	initializeVBO() {
		this.vbo = this.gl.createBuffer();
		if (!this.vbo) {
			throw new Error("When creating vertex buffer");
		}

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
	}

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
		cols: number
	) {
		// set GL program to renderer
		this.gl.useProgram(this.program);

		// update canvas size
		this.canvas.width = canvasWidth;
		this.canvas.height = canvasHeight;
		this.canvasWidth = canvasWidth;
		this.canvasHeight = canvasHeight;

		// update uniforms & viewport
		this.gl.uniform1i(this.uniforms.rows, rows);
		this.gl.uniform1i(this.uniforms.cols, cols);

		// set count to the number of vertices
		this.count = rows * cols * 6;

		// resize the offscreen texture
		this.visuals.resize(cols, rows);
	}

	setData(data: Uint32Array) {
		this.gl.useProgram(this.program);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.DYNAMIC_DRAW);
	}

	setPalette(palette: Float32Array) {
		this.gl.useProgram(this.program);
		this.gl.uniform3fv(this.uniforms.palette, palette);
		this.palette = palette;
		this.visuals.setPalette(palette);
	}

	draw() {
		// render the offscreen program first
		this.visuals.draw();

		// use renderer program
		this.gl.useProgram(this.program);

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

		// bind textures (including offscreen texture)
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.glyphAtlasTexture);
		this.gl.activeTexture(this.gl.TEXTURE1);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.visuals.texture);

		// render to the canvas
		this.gl.viewport(0, 0, this.canvasWidth, this.canvasHeight);
		this.gl.drawArrays(this.gl.TRIANGLES, 0, this.count);
	}
}

export { Renderer };
