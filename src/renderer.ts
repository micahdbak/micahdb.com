import { Mat4 } from "./math.ts";

import VERTEX_SHADER from "./main.vert" with { type: "text" };
import FRAGMENT_SHADER from "./main.frag" with { type: "text" };

class Renderer {
	private canvas: HTMLCanvasElement;
	private gl: WebGLRenderingContext;
	private program: WebGLProgram;

	private attributeLocations: {
		position: number;
		colour: number;
	};

	private uniformLocations: {
		projection: WebGLUniformLocation | null;
	};

	private vbo: WebGLBuffer;
	private cbo: WebGLBuffer;

	private count: number;

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

		this.initializeProgram();

		this.attributeLocations = {
			position: this.gl.getAttribLocation(this.program, "a_position"),
			colour: this.gl.getAttribLocation(this.program, "a_colour")
		};

		this.uniformLocations = {
			projection: this.gl.getUniformLocation(this.program, "u_projection")
		};

		this.updateProjectionMatrix();

		// positions buffer
		this.vbo = this.gl.createBuffer();
		if (!this.vbo) {
			throw new Error("When creating positions buffer");
		}

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
		this.gl.vertexAttribPointer(
			this.attributeLocations.position,
			2,
			this.gl.FLOAT,
			false,
			0,
			0
		);
		this.gl.enableVertexAttribArray(this.attributeLocations.position);

		// colours buffer
		this.cbo = this.gl.createBuffer();
		if (!this.cbo) {
			throw new Error("When creating colours buffer");
		}

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cbo);
		this.gl.vertexAttribPointer(
			this.attributeLocations.colour,
			3,
			this.gl.FLOAT,
			false,
			0,
			0
		);
		this.gl.enableVertexAttribArray(this.attributeLocations.colour);

		this.count = 0;
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
		this.gl.uniformMatrix4fv(
			this.uniformLocations.projection,
			false,
			projection
		);
		this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
	}

	setVertices(vertices: Float32Array) {
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.DYNAMIC_DRAW);
		this.count = vertices.length / 2;
	}

	setColours(colours: Float32Array) {
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cbo);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, colours, this.gl.DYNAMIC_DRAW);
		this.count = colours.length / 3;
	}

	draw() {
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		this.gl.drawArrays(this.gl.TRIANGLES, 0, this.count);
	}
}

export { Renderer };
