import VERTEX_SHADER from "./sphere.vert" with { type: "text" };
import FRAGMENT_SHADER from "./sphere.frag" with { type: "text" };

import { Program } from "../program.ts";
import { Mat4 } from "./math.ts";
import { SphereMesh } from "./meshes/sphere.ts";

export class SphereProgram extends Program {
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
	};

	private vbo: WebGLBuffer;
	private ibo: WebGLBuffer;

	private sphere: SphereMesh;

	init() {
		this.initializeProgram(VERTEX_SHADER, FRAGMENT_SHADER);
		this.initializeLocations();
		this.initializeDBO();
		this.initializeFBO();
		this.initializeVBO();
		this.initializeIBO();

		this.sphere = new SphereMesh(10, 10);

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
		this.gl.bufferData(
			this.gl.ARRAY_BUFFER,
			this.sphere.data(),
			this.gl.STATIC_DRAW
		);
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ibo);
		this.gl.bufferData(
			this.gl.ELEMENT_ARRAY_BUFFER,
			new Uint16Array(this.sphere.indices),
			this.gl.STATIC_DRAW
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

		if (!projectionMatrix || !viewMatrix || !modelMatrix || !normalMatrix) {
			throw new Error("When getting uniform locations");
		}

		// store uniform locations
		this.uniforms = {
			projectionMatrix,
			modelMatrix,
			viewMatrix,
			normalMatrix
		};
	}

	initializeVBO() {
		this.vbo = this.gl.createBuffer();
		if (!this.vbo) {
			throw new Error("When creating vertex buffer");
		}
	}

	initializeIBO() {
		this.ibo = this.gl.createBuffer();
		if (!this.ibo) {
			throw new Error("When creating index buffer");
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

	draw() {
		this.gl.useProgram(this.glProgram);
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
		this.gl.enable(this.gl.DEPTH_TEST);

		const viewMatrix = Mat4.create();
		Mat4.lookAt(viewMatrix, [0.0, 3.0, 4.0], [0.0, 0.0, 0.0], [0.0, -1.0, 0.0]);
		this.gl.uniformMatrix4fv(this.uniforms.viewMatrix, false, viewMatrix);

		const modelMatrix = Mat4.rotation(
			"y",
			(2.0 * Math.PI * (Date.now() % 5000)) / 5000
		);
		this.gl.uniformMatrix4fv(this.uniforms.modelMatrix, false, modelMatrix);

		const normalMatrix = new Float32Array(9); // 3x3 matrix
		const modelViewMatrix = Mat4.create();
		Mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
		Mat4.inverseTranspose3x3(normalMatrix, modelViewMatrix);
		this.gl.uniformMatrix3fv(this.uniforms.normalMatrix, false, normalMatrix);

		this.sphere.enableAttributes(this.gl, this.vbo, this.attributes);

		this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

		this.gl.viewport(0, 0, this.targetWidth, this.targetHeight);

		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ibo);
		this.gl.drawElements(
			this.gl.TRIANGLES,
			this.sphere.indices.length,
			this.gl.UNSIGNED_SHORT,
			0
		);

		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
	}
}
