import VERTEX_SHADER from "./cube.vert" with { type: "text" };
import FRAGMENT_SHADER from "./cube.frag" with { type: "text" };

import { CUBE_TEXTURE_INDEX, CUBE_TEXTURE_PATH } from "../textures.ts";
import { Visuals } from "../visuals.ts";
import { Mat4 } from "./math.ts";

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
	static readonly NUM_VERTICES = 36;

	public positions: number[];
	public normals: number[];
	public uvCoords: number[];

	constructor() {
		// all are ordered by the following faces when looking
		// down negative the z axis with positive y upwards:
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

		// prettier-ignore
		this.uvCoords = [
			0, 1, 0, 2/3, 1/2, 2/3, 0, 1, 1/2, 2/3, 1/2, 1,
			1/2, 1/3, 1/2, 0, 1, 0, 1/2, 1/3, 1, 0, 1, 1/3,
			0, 2/3, 0, 1/3, 1/2, 1/3, 0, 2/3, 1/2, 1/3, 1/2, 2/3,
			1/2, 2/3, 1/2, 1/3, 1, 1/3, 1/2, 2/3, 1, 1/3, 1, 2/3,
			0, 1/3, 0, 0, 1/2, 0, 0, 1/3, 1/2, 0, 1/2, 1/3,
			1/2, 1, 1/2, 2/3, 1, 2/3, 1/2, 1, 1, 2/3, 1, 1,
		];
	}

	data(): Float32Array {
		const buffer = [];

		for (let i = 0; i < this.positions.length / 3; i++) {
			const baseVec3 = i * 3;
			const baseVec2 = i * 2;

			// each vertex in the vbo is vec3 a_position, a_normal; vec2 a_uvCoord
			buffer.push(
				this.positions[baseVec3],
				this.positions[baseVec3 + 1],
				this.positions[baseVec3 + 2],
				this.normals[baseVec3],
				this.normals[baseVec3 + 1],
				this.normals[baseVec3 + 2],
				this.uvCoords[baseVec2],
				this.uvCoords[baseVec2 + 1]
			);
		}

		return new Float32Array(buffer);
	}
}

class CubeVisuals extends Visuals {
	// each vertex is stored in the vertex buffer like so:
	// 2. vec3 a_position (3 floats * 4 bytes)
	// 3. vec3 a_normal (3 floats * 4 bytes)
	// 3. vec2 a_uvCoord (2 floats * 4 bytes)
	// total/stride: 32 bytes
	static readonly STRIDE = 32;

	private attributes: {
		position: number;
		normal: number;
		uvCoord: number;
	};

	private uniforms: {
		projectionMatrix: WebGLUniformLocation;
		viewMatrix: WebGLUniformLocation;
		modelMatrix: WebGLUniformLocation;
		normalMatrix: WebGLUniformLocation;
		cubeTexture: WebGLUniformLocation;
		cols: WebGLUniformLocation;
		rows: WebGLUniformLocation;
	};

	private dbo: WebGLRenderbuffer;
	private fbo: WebGLFramebuffer;
	private vbo: WebGLBuffer;
	private cols: number = 0;
	private rows: number = 0;

	private cubeTexture: WebGLTexture;

	async init() {
		this.initializeProgram();
		this.initializeLocations();
		this.initializeDBO();
		this.initializeFBO();
		this.initializeVBO();
		await this.initializeTexture();

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
			normal: this.gl.getAttribLocation(this.program, "a_normal"),
			uvCoord: this.gl.getAttribLocation(this.program, "a_uvCoord")
		};

		if (
			this.attributes.position < 0 ||
			this.attributes.normal < 0 ||
			this.attributes.uvCoord < 0
		) {
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
		const cubeTexture = this.gl.getUniformLocation(
			this.program,
			"u_cubeTexture"
		);
		const cols = this.gl.getUniformLocation(this.program, "u_cols");
		const rows = this.gl.getUniformLocation(this.program, "u_rows");

		if (
			!projectionMatrix ||
			!viewMatrix ||
			!modelMatrix ||
			!normalMatrix ||
			!cubeTexture /*||
			!cols ||
			!rows*/
		) {
			throw new Error("When getting uniform locations");
		}

		// store uniform locations
		this.uniforms = {
			projectionMatrix,
			modelMatrix,
			viewMatrix,
			normalMatrix,
			cubeTexture,
			cols,
			rows
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

	async initializeTexture() {
		await new Promise((resolve, reject) => {
			const image = new Image();
			image.src = CUBE_TEXTURE_PATH;
			image.onload = () => {
				const tex = this.gl.createTexture();
				if (!tex) {
					reject(new Error("When creating GL texture"));
					return;
				}

				this.gl.bindTexture(this.gl.TEXTURE_2D, tex);

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

				this.cubeTexture = tex;

				resolve();
			};
		});

		this.gl.uniform1i(this.uniforms.cubeTexture, CUBE_TEXTURE_INDEX);
	}

	resized(width: number, height: number) {
		this.cols = width;
		this.rows = height;

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

		this.gl.uniform1f(this.uniforms.cols, this.cols);
		this.gl.uniform1f(this.uniforms.rows, this.rows);

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
		// 3. vec2 a_uvCoord (2 floats * 4 bytes) [offset: 24]
		// total/stride: 32 bytes

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

		// UV coordinate
		this.gl.vertexAttribPointer(
			this.attributes.uvCoord,
			2,
			this.gl.FLOAT,
			false,
			CubeVisuals.STRIDE,
			24
		);
		this.gl.enableVertexAttribArray(this.attributes.uvCoord);
	}

	draw() {
		this.gl.useProgram(this.program);
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
		this.gl.enable(this.gl.DEPTH_TEST);

		const viewMatrix = Mat4.create();
		Mat4.lookAt(viewMatrix, [0.0, 3.0, 4.0], [0.0, 0.0, 0.0], [0.0, -1.0, 0.0]);
		this.gl.uniformMatrix4fv(this.uniforms.viewMatrix, false, viewMatrix);

		const xRotate = _rotationMatrix(
			"z",
			(2.0 * Math.PI * (Date.now() % 5000)) / 5000
		);
		const yRotate = _rotationMatrix(
			"x",
			(2.0 * Math.PI * (Date.now() % 6000)) / 6000
		);
		const zRotate = _rotationMatrix(
			"y",
			(2.0 * Math.PI * (Date.now() % 7000)) / 7000
		);
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

		this.gl.activeTexture(this.gl.TEXTURE0 + CUBE_TEXTURE_INDEX);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.cubeTexture);

		this.gl.viewport(0, 0, this.targetWidth, this.targetHeight);
		this.gl.drawArrays(this.gl.TRIANGLES, 0, CubeMesh.NUM_VERTICES);

		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
	}
}

export { CubeVisuals };
