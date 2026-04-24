import VERTEX_SHADER from "./main.vert" with { type: "text" };
import FRAGMENT_SHADER from "./main.frag" with { type: "text" };

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
		palette: WebGLUniformLocation;
	};

	private vbo: WebGLBuffer;
	private count: number;

	private glyphAtlasTexture: WebGLTexture;

	private palette: Float32Array;

	public canvas: HTMLCanvasElement;
	public canvasWidth: number;
	public canvasHeight: number;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;

		const gl: WebGL2RenderingContext | null = this.canvas.getContext("webgl2");
		if (!gl) {
			window.location.href = "./about.html";
			return;
		}

		this.gl = gl;
		this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
		this.gl.clearDepth(1.0);
	}

	async init() {
		this.initializeProgram();
		await this.initializeGlyphAtlas();
		this.initializeVBO();
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
		const palette = this.gl.getUniformLocation(this.program, "u_palette");

		if (!rows || !cols || !glyphAtlas || !palette) {
			throw new Error("When getting uniform locations");
		}

		// store uniform locations
		this.uniforms = { rows, cols, glyphAtlas, palette };
	}

	async initializeGlyphAtlas() {
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
		// update canvas size
		this.canvas.width = canvasWidth;
		this.canvas.height = canvasHeight;

		// update uniforms & viewport
		this.gl.uniform1i(this.uniforms.rows, rows);
		this.gl.uniform1i(this.uniforms.cols, cols);
		this.gl.viewport(0, 0, canvasWidth, canvasHeight);

		// set count to the number of vertices
		this.count = rows * cols * 6;
	}

	setData(data: Uint32Array) {
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.DYNAMIC_DRAW);
	}

	setPalette(palette: Float32Array) {
		this.gl.uniform3fv(this.uniforms.palette, palette);
		this.palette = palette;
	}

	draw() {
		this.gl.clearColor(this.palette[0], this.palette[1], this.palette[2], 1.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.glyphAtlasTexture);
		this.gl.drawArrays(this.gl.TRIANGLES, 0, this.count);
	}
}

export { Renderer };
