import { Mat4 } from "./math.ts";

import VERTEX_SHADER from "./main.vert" with { type: "text" };
import FRAGMENT_SHADER from "./main.frag" with { type: "text" };

class Renderer {
	private canvas: HTMLCanvasElement;
	private gl: WebGLRenderingContext;
	private program: WebGLProgram;

	private attributes: {
		position: number;
		colour: number;
		uvCoord: number;
	};

	private uniforms: {
		projection: WebGLUniformLocation;
		glyphAtlas: WebGLUniformLocation;
	};

	// 1. vec2 a_position (2 floats * 4 bytes = 8 bytes)
	// 2. vec3 a_colour (3 floats * 4 bytes = 12 bytes)
	// 3. vec2 a_uvCoord (2 floats * 4 bytes = 8 bytes)
	// total/stride: 28 bytes per vertex
	private stride = 28;

	private vbo: WebGLBuffer;
	private count: number;

	private glyphAtlasTexture: WebGLTexture;

	public glyphWidth = 154;
	public glyphHeight = 338;

	public glyphAtlasWidth: number;
	public glyphAtlasHeight: number;

	public cols: number;
	public rows: number;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;

		const gl: WebGLRenderingContext | null = this.canvas.getContext("webgl");
		if (!gl) {
			window.location.href = "./about.html";
			return;
		}

		this.gl = gl!;
		this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
		this.gl.clearDepth(1.0);
	}

	async init() {
		this.initializeProgram();
		await this.initializeGlyphAtlas();
		this.initializeVBO();
		this.updateProjectionMatrix();
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
			position: this.gl.getAttribLocation(this.program, "a_position"),
			colour: this.gl.getAttribLocation(this.program, "a_colour"),
			uvCoord: this.gl.getAttribLocation(this.program, "a_uvCoord")
		};

		if (
			this.attributes.position < 0 ||
			this.attributes.colour < 0 ||
			this.attributes.uvCoord < 0
		) {
			throw new Error("When getting attribute locations");
		}

		const projection = this.gl.getUniformLocation(this.program, "u_projection");
		const glyphAtlas = this.gl.getUniformLocation(this.program, "u_glyphAtlas");

		if (!projection || !glyphAtlas) {
			throw new Error("When getting uniform locations");
		}

		// store uniform locations
		this.uniforms = { projection, glyphAtlas };
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
				this.glyphAtlasWidth = image.width;
				this.glyphAtlasHeight = image.height;
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
		// 1. vec2 a_position (2 floats * 4 bytes = 8 bytes) [offset: 0]
		// 2. vec3 a_colour (3 floats * 4 bytes = 12 bytes) [offset: 8]
		// 3. vec2 a_uvCoord (2 floats * 4 bytes = 8 bytes) [offset: 20]
		// total/stride: 28 bytes

		// position
		this.gl.vertexAttribPointer(
			this.attributes.position,
			2,
			this.gl.FLOAT,
			false,
			this.stride,
			0
		);
		this.gl.enableVertexAttribArray(this.attributes.position);

		// colour
		this.gl.vertexAttribPointer(
			this.attributes.colour,
			3,
			this.gl.FLOAT,
			false,
			this.stride,
			8
		);
		this.gl.enableVertexAttribArray(this.attributes.colour);

		// UV coordinae
		this.gl.vertexAttribPointer(
			this.attributes.uvCoord,
			2,
			this.gl.FLOAT,
			false,
			this.stride,
			20
		);
		this.gl.enableVertexAttribArray(this.attributes.uvCoord);
	}

	updateProjectionMatrix() {
		// update canvas size
		const dpr = window.devicePixelRatio || 1;
		this.canvas.width = this.canvas.clientWidth * dpr;
		this.canvas.height = this.canvas.clientHeight * dpr;

		// prepare projection matrix
		const projection = Mat4.create();
		Mat4.orthographic(
			projection,
			0,
			this.canvas.width,
			this.canvas.height,
			0,
			-1,
			1
		);

		// update uniform & viewport
		this.gl.uniformMatrix4fv(this.uniforms.projection, false, projection);
		this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

		this.cols = this.canvas.width / this.glyphWidth;
		this.rows = this.canvas.height / this.glyphHeight;
	}

	setData(data: Float32Array) {
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.DYNAMIC_DRAW);
		this.count = Math.floor(data.length / (this.stride / 4));
	}

	draw() {
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.glyphAtlasTexture);
		this.gl.drawArrays(this.gl.TRIANGLES, 0, this.count);
	}
}

export { Renderer };
