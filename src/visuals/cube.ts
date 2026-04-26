import VERTEX_SHADER from "./cube.vert" with { type: "text" };
import FRAGMENT_SHADER from "./cube.frag" with { type: "text" };

import { Mat4 } from "./math.ts";
import { Visuals } from "../visuals.ts";

class CubeVisuals extends Visuals {
	// each vertex is stored in the vertex buffer like so:
	// 2. vec3 a_position (3 floats * 4 bytes)
	// 3. vec3 a_colour (3 floats * 4 bytes)
	// total/stride: 24 bytes
	static readonly STRIDE = 24;

	private attributes: {
		position: number;
		colour: number;
	};

	private uniforms: {
		worldMatrix: WebGLUniformLocation;
		viewMatrix: WebGLUniformLocation;
		palette: WebGLUniformLocation;
	};

	private fbo: WebGLFramebuffer;
	private vbo: WebGLBuffer;

	init() {
		this.initializeProgram();
		this.initializeLocations();
		this.initializeFBO();
		this.initializeVBO();

		this.gl.uniformMatrix4fv(this.uniforms.worldMatrix, false, Mat4.create());
		this.gl.uniformMatrix4fv(this.uniforms.viewMatrix, false, Mat4.create());

		const triangle = [
			0.0, -0.5, 0.0, 1.0, 0.0, 0.0, -0.5, 0.5, 0.0, 0.0, 1.0, 0.0, 0.5, 0.5,
			0.0, 0.0, 0.0, 1.0
		];

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
		this.gl.bufferData(
			this.gl.ARRAY_BUFFER,
			new Float32Array(triangle),
			this.gl.DYNAMIC_DRAW
		);
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
			position: this.gl.getAttribLocation(this.program, "a_position"),
			colour: this.gl.getAttribLocation(this.program, "a_colour")
		};

		if (this.attributes.position < 0 || this.attributes.colour < 0) {
			throw new Error("When getting attribute locations");
		}

		const worldMatrix = this.gl.getUniformLocation(
			this.program,
			"u_worldMatrix"
		);
		const viewMatrix = this.gl.getUniformLocation(this.program, "u_viewMatrix");
		const palette = this.gl.getUniformLocation(this.program, "u_palette");

		if (!worldMatrix || !viewMatrix || !palette) {
			throw new Error("When getting uniform locations");
		}

		// store uniform locations
		this.uniforms = { worldMatrix, viewMatrix, palette };
	}

	initializeFBO() {
		this.fbo = this.gl.createFramebuffer();
		if (!this.fbo) {
			throw new Error("When creating frame buffer");
		}

		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
		this.gl.framebufferTexture2D(
			this.gl.FRAMEBUFFER,
			this.gl.COLOR_ATTACHMENT0,
			this.gl.TEXTURE_2D,
			this.texture,
			0
		);
	}

	initializeVBO() {
		this.vbo = this.gl.createBuffer();
		if (!this.vbo) {
			throw new Error("When creating vertex buffer");
		}
	}

	enableAttributes() {
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);

		// each vertex is stored in the vertex buffer like so:
		// 2. vec3 a_position (3 floats * 4 bytes) [offset: 0]
		// 3. vec3 a_colour (3 floats * 4 bytes) [offset: 12]
		// total/stride: 24 bytes

		// position
		this.gl.vertexAttribPointer(
			this.attributes.position,
			3,
			this.gl.FLOAT,
			false,
			CubeVisuals.STRIDE,
			0
		);
		this.gl.enableVertexAttribArray(this.attributes.position);

		// colour
		this.gl.vertexAttribPointer(
			this.attributes.colour,
			3,
			this.gl.FLOAT,
			false,
			CubeVisuals.STRIDE,
			12
		);
		this.gl.enableVertexAttribArray(this.attributes.colour);
	}

	setPalette(palette: Float32Array) {
		this.gl.useProgram(this.program);
		this.gl.uniform3fv(this.uniforms.palette, palette);
	}

	draw() {
		this.gl.useProgram(this.program);
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);

		this.enableAttributes();

		this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);

		this.gl.viewport(0, 0, this.targetWidth, this.targetHeight);
		this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);

		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
	}
}

export { CubeVisuals };
