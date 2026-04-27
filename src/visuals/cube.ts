import VERTEX_SHADER from "./cube.vert" with { type: "text" };
import FRAGMENT_SHADER from "./cube.frag" with { type: "text" };

import { Mat4 } from "./math.ts";
import { Visuals } from "../visuals.ts";

function _repeat(arr: number[], n: number): number[] {
	const ret = [];

	for (let i = 0; i < n; i++) {
		ret.push(...arr);
	}

	return ret;
}

function _rotationMatrix(axis: str, radians: number): Float32Array {
	const c = Math.cos(radians);
	const s = Math.sin(radians);
	const T = Mat4.create();

	switch (axis) {
		case "x":
			// prettier-ignore
			Mat4.set(T,
			1, 0, 0, 0,
			0, c, s, 0,
			0, -s, c, 0,
			0, 0, 0, 1);

			break;

		case "y":
			// prettier-ignore
			Mat4.set(T,
			c, 0, -s, 0,
			0, 1, 0, 0,
			s, 0, c, 0,
			0, 0, 0, 1);

			break;

		case "z":
			// prettier-ignore
			Mat4.set(T,
			c, s, 0, 0,
			-s, c, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1);

			break;
	}

	return T;
}

class CubeMesh {
	public positions: number[];
	public normals: number[];

	constructor() {
		// all are ordered by face:
		// - front
		// - back
		// - right
		// - left
		// - top
		// - bottom

		// vertex coords
		const blf = [-1, -1, 1]; // bottom-left-front
		const blb = [-1, -1, -1]; // bottom-left-back
		const brf = [1, -1, 1]; // bottom-right-front
		const brb = [1, -1, -1]; // bottom-right-back
		const tlf = [-1, 1, 1]; // top-left-front
		const tlb = [-1, 1, -1]; // top-left-back
		const trf = [1, 1, 1]; // top-right-front
		const trb = [1, 1, -1]; // top-right-back

		// prettier-ignore
		this.positions = [
			...tlf, ...blf, ...brf, ...tlf, ...brf, ...trf,
			...trb, ...brb, ...blb, ...trb, ...blb, ...tlb,
			...trf, ...brf, ...brb, ...trf, ...brb, ...trb,
			...tlb, ...blb, ...blf, ...tlb, ...blf, ...tlf,
			...tlb, ...tlf, ...trf, ...tlb, ...trf, ...trb,
			...blf, ...blb, ...brb, ...blf, ...brb, ...brf,
		];

		this.normals = [
			..._repeat([0, 0, 1], 6),
			..._repeat([0, 0, -1], 6),
			..._repeat([1, 0, 0], 6),
			..._repeat([-1, 0, 0], 6),
			..._repeat([0, 1, 0], 6),
			..._repeat([0, -1, 0], 6)
		];

		/*
		this.uvCoords = [
			0, 1, 0, 2/3, 1/2, 2/3, 0, 1, 1/2, 2/3, 1/2, 1,
			1/2, 1/3, 1/2, 0, 1, 0, 1/2, 1/3, 1, 0, 1, 1/3,
			0, 2/3, 0, 1/3, 1/2, 1/3, 0, 2/3, 1/2, 1/3, 1/2, 2/3,
			1/2, 2/3, 1/2, 1/3, 1, 1/3, 1/2, 2/3, 1, 1/3, 1, 2/3,
			0, 1/3, 0, 0, 1/2, 0, 0, 1/3, 1/2, 0, 1/2, 1/3,
			1/2, 1, 1/2, 2/3, 1, 2/3, 1/2, 1, 1, 2/3, 1, 1,
		];
		*/
	}

	data(): Float32Array {
		const buffer = [];

		for (let i = 0; i < this.positions.length / 3; i++) {
			const base = i * 3;

			// each vertex in the vbo is vec3 a_position, a_normal
			buffer.push(
				this.positions[base],
				this.positions[base + 1],
				this.positions[base + 2],
				this.normals[base],
				this.normals[base + 1],
				this.normals[base + 2]
			);
		}

		return new Float32Array(buffer);
	}
}

class CubeVisuals extends Visuals {
	// each vertex is stored in the vertex buffer like so:
	// 2. vec3 a_position (3 floats * 4 bytes)
	// 3. vec3 a_normal (3 floats * 4 bytes)
	// total/stride: 24 bytes
	static readonly STRIDE = 24;

	private attributes: {
		position: number;
		normal: number;
	};

	private uniforms: {
		projectionMatrix: WebGLUniformLocation;
		viewMatrix: WebGLUniformLocation;
		modelMatrix: WebGLUniformLocation;
		normalMatrix: WebGLUniformLocation;
		palette: WebGLUniformLocation;
	};

	private dbo: WebGLRenderbuffer;
	private fbo: WebGLFramebuffer;
	private vbo: WebGLBuffer;

	init() {
		this.initializeProgram();
		this.initializeLocations();
		this.resized(1, 1);
		this.initializeDBO();
		this.initializeFBO();
		this.initializeVBO();

		const cube = new CubeMesh();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, cube.data(), this.gl.DYNAMIC_DRAW);
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
			normal: this.gl.getAttribLocation(this.program, "a_normal")
		};

		if (this.attributes.position < 0 || this.attributes.normal < 0) {
			throw new Error("When getting attribute locations");
		}

		const projectionMatrix = this.gl.getUniformLocation(
			this.program,
			"u_projectionMatrix"
		);
		const viewMatrix = this.gl.getUniformLocation(this.program, "u_viewMatrix");
		const modelMatrix = this.gl.getUniformLocation(
			this.program,
			"u_modelMatrix"
		);
		const normalMatrix = this.gl.getUniformLocation(
			this.program,
			"u_normalMatrix"
		);
		const palette = this.gl.getUniformLocation(this.program, "u_palette");

		if (
			!projectionMatrix ||
			!viewMatrix ||
			!modelMatrix ||
			!normalMatrix ||
			!palette
		) {
			throw new Error("When getting uniform locations");
		}

		// store uniform locations
		this.uniforms = {
			projectionMatrix,
			modelMatrix,
			viewMatrix,
			normalMatrix,
			palette
		};
	}

	initializeDBO() {
		this.dbo = this.gl.createRenderbuffer();
		if (!this.dbo) {
			throw new Error("When creating depth render buffer");
		}

		this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.dbo);
		this.gl.renderbufferStorage(
			this.gl.RENDERBUFFER,
			this.gl.DEPTH_COMPONENT16,
			this.targetWidth,
			this.targetHeight
		);
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
		this.gl.framebufferRenderbuffer(
			this.gl.FRAMEBUFFER,
			this.gl.DEPTH_ATTACHMENT,
			this.gl.RENDERBUFFER,
			this.dbo
		);
	}

	initializeVBO() {
		this.vbo = this.gl.createBuffer();
		if (!this.vbo) {
			throw new Error("When creating vertex buffer");
		}
	}

	resized(width: number, height: number) {
		// reset projection matrix
		const projectionMatrix = Mat4.create();
		const fovy = Math.PI / 4;
		const aspect = (0.5 * width) / height;
		const near = 0.1;
		const far = 100.0;
		Mat4.perspective(projectionMatrix, fovy, aspect, near, far);
		this.gl.uniformMatrix4fv(
			this.uniforms.projectionMatrix,
			false,
			projectionMatrix
		);

		// update depth buffer size to match texture
		this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.dbo);
		this.gl.renderbufferStorage(
			this.gl.RENDERBUFFER,
			this.gl.DEPTH_COMPONENT16,
			width,
			height
		);
	}

	enableAttributes() {
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);

		// each vertex is stored in the vertex buffer like so:
		// 2. vec3 a_position (3 floats * 4 bytes) [offset: 0]
		// 3. vec3 a_normal (3 floats * 4 bytes) [offset: 12]
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

		// normal
		this.gl.vertexAttribPointer(
			this.attributes.normal,
			3,
			this.gl.FLOAT,
			false,
			CubeVisuals.STRIDE,
			12
		);
		this.gl.enableVertexAttribArray(this.attributes.normal);
	}

	setPalette(palette: Float32Array) {
		this.gl.useProgram(this.program);
		this.gl.uniform3fv(this.uniforms.palette, palette);
	}

	draw() {
		this.gl.useProgram(this.program);
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
		this.gl.enable(this.gl.DEPTH_TEST);

		const viewMatrix = Mat4.create();
		Mat4.lookAt(viewMatrix, [0.0, 3.0, 4.0], [0.0, 0.0, 0.0], [0.0, -1.0, 0.0]);
		this.gl.uniformMatrix4fv(this.uniforms.viewMatrix, false, viewMatrix);

		const xRotate = _rotationMatrix("x", 2.0 * Math.PI * (Date.now() % 5000) / 5000);
		const yRotate = _rotationMatrix("y", 2.0 * Math.PI * (Date.now() % 6000) / 6000);
		const zRotate = _rotationMatrix("z", 2.0 * Math.PI * (Date.now() % 7000) / 7000);
		const modelMatrix = Mat4.create();
		Mat4.multiply(modelMatrix, xRotate, yRotate);
		Mat4.multiply(modelMatrix, modelMatrix, zRotate);
		this.gl.uniformMatrix4fv(this.uniforms.modelMatrix, false, modelMatrix);

		const normalMatrix = new Float32Array(9); // 3x3 matrix
		const modelViewMatrix = Mat4.create();
		Mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
		Mat4.inverseTranspose3x3(normalMatrix, modelViewMatrix);
		this.gl.uniformMatrix3fv(this.uniforms.normalMatrix, false, normalMatrix);

		this.enableAttributes();

		this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

		this.gl.viewport(0, 0, this.targetWidth, this.targetHeight);
		this.gl.drawArrays(this.gl.TRIANGLES, 0, 36);

		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
	}
}

export { CubeVisuals };
