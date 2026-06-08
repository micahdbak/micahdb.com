import VERTEX_SHADER from "./cube.vert" with { type: "text" };
import FRAGMENT_SHADER from "./cube.frag" with { type: "text" };

import {
	CUBE_TEXTURE_INDEX,
	CUBE_TEXTURE_PATH,
	CUBE_NORMAL_INDEX,
	CUBE_NORMAL_PATH,
	loadTexture
} from "../textures.ts";
import { Program } from "../program.ts";
import { Mat4 } from "./math.ts";
import { CubeMesh } from "./meshes/cube.ts";

class CubeProgram extends Program {
	private attributes: {
		position: number;
		normal: number;
		tangent: number;
		uvCoord: number;
	};

	private uniforms: {
		projectionMatrix: WebGLUniformLocation;
		viewMatrix: WebGLUniformLocation;
		modelMatrix: WebGLUniformLocation;
		normalMatrix: WebGLUniformLocation;
		cubeTexture: WebGLUniformLocation;
		cubeNormal: WebGLUniformLocation;
	};

	private vbo: WebGLBuffer;

	private cube: CubeMesh;

	private cubeTexture: WebGLTexture;
	private cubeNormal: WebGLTexture;

	async init() {
		this.initializeProgram(VERTEX_SHADER, FRAGMENT_SHADER);
		this.initializeLocations();
		this.initializeDBO();
		this.initializeFBO();
		this.initializeVBO();
		await this.initializeTexture();

		this.cube = new CubeMesh();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
		this.gl.bufferData(
			this.gl.ARRAY_BUFFER,
			this.cube.data(),
			this.gl.DYNAMIC_DRAW
		);
	}

	initializeLocations() {
		// store attribute locations
		this.attributes = {
			position: this.gl.getAttribLocation(this.glProgram, "a_position"),
			normal: this.gl.getAttribLocation(this.glProgram, "a_normal"),
			tangent: this.gl.getAttribLocation(this.glProgram, "a_tangent"),
			uvCoord: this.gl.getAttribLocation(this.glProgram, "a_uvCoord")
		};

		if (
			this.attributes.position < 0 ||
			this.attributes.normal < 0 ||
			this.attributes.tangent < 0 ||
			this.attributes.uvCoord < 0
		) {
			throw new Error("When getting attribute locations");
		}

		const projectionMatrix = this.gl.getUniformLocation(
			this.glProgram,
			"u_projectionMatrix"
		);
		const viewMatrix = this.gl.getUniformLocation(
			this.glProgram,
			"u_viewMatrix"
		);
		const modelMatrix = this.gl.getUniformLocation(
			this.glProgram,
			"u_modelMatrix"
		);
		const normalMatrix = this.gl.getUniformLocation(
			this.glProgram,
			"u_normalMatrix"
		);
		const cubeTexture = this.gl.getUniformLocation(
			this.glProgram,
			"u_cubeTexture"
		);
		const cubeNormal = this.gl.getUniformLocation(
			this.glProgram,
			"u_cubeNormal"
		);

		if (
			!projectionMatrix ||
			!viewMatrix ||
			!modelMatrix ||
			!normalMatrix ||
			!cubeTexture ||
			!cubeNormal
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
			cubeNormal
		};
	}

	initializeVBO() {
		this.vbo = this.gl.createBuffer();
		if (!this.vbo) {
			throw new Error("When creating vertex buffer");
		}
	}

	async initializeTexture() {
		this.cubeTexture = await loadTexture(this.gl, CUBE_TEXTURE_PATH);
		this.cubeNormal = await loadTexture(this.gl, CUBE_NORMAL_PATH);
		this.gl.uniform1i(this.uniforms.cubeTexture, CUBE_TEXTURE_INDEX);
		this.gl.uniform1i(this.uniforms.cubeNormal, CUBE_NORMAL_INDEX);
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

	draw() {
		this.gl.useProgram(this.glProgram);
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
		this.gl.enable(this.gl.DEPTH_TEST);

		const viewMatrix = Mat4.create();
		Mat4.lookAt(viewMatrix, [0.0, 3.0, 4.0], [0.0, 0.0, 0.0], [0.0, -1.0, 0.0]);
		this.gl.uniformMatrix4fv(this.uniforms.viewMatrix, false, viewMatrix);

		const xRotate = Mat4.rotation(
			"z",
			(2.0 * Math.PI * (Date.now() % 5000)) / 5000
		);
		const yRotate = Mat4.rotation(
			"x",
			(2.0 * Math.PI * (Date.now() % 6000)) / 6000
		);
		const zRotate = Mat4.rotation(
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

		this.cube.enableAttributes(this.gl, this.vbo, this.attributes);

		this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

		this.gl.activeTexture(this.gl.TEXTURE0 + CUBE_TEXTURE_INDEX);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.cubeTexture);

		this.gl.activeTexture(this.gl.TEXTURE0 + CUBE_NORMAL_INDEX);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.cubeNormal);

		this.gl.viewport(0, 0, this.targetWidth, this.targetHeight);

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
		this.gl.drawArrays(this.gl.TRIANGLES, 0, CubeMesh.NUM_VERTICES);

		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
	}
}

export { CubeProgram };
