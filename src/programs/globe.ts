import VERTEX_SHADER from "./globe.vert" with { type: "text" };
import FRAGMENT_SHADER from "./globe.frag" with { type: "text" };

import {
	GLOBE_TEXTURE_INDEX,
	GLOBE_NORMAL_INDEX,
	EARTH_TEXTURE_PATH,
	EARTH_NORMAL_PATH,
	WHITE_TEXTURE_PATH,
	SMOOTH_NORMAL_PATH,
	loadTexture
} from "../textures.ts";
import { Program } from "../program.ts";
import { Mat4 } from "./math.ts";
import { SphereMesh } from "./meshes/sphere.ts";

export class GlobeProgram extends Program {
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
		globeTexture: WebGLUniformLocation;
		globeNormal: WebGLUniformLocation;
		lightPosition: WebGLUniformLocation;
	};

	private vbo: WebGLBuffer;
	private ibo: WebGLBuffer;

	private sphere: SphereMesh;

	private earthTexture: WebGLTexture;
	private earthNormal: WebGLTexture;
	private moonTexture: WebGLTexture;
	private moonNormal: WebGLTexture;

	async init() {
		this.initializeProgram(VERTEX_SHADER, FRAGMENT_SHADER);
		this.initializeLocations();
		this.initializeDBO();
		this.initializeFBO();
		this.initializeVBO();
		this.initializeIBO();
		await this.initializeTexture();

		this.sphere = new SphereMesh(15, 31);

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
		const globeTexture = this.gl.getUniformLocation(
			this.glProgram,
			"u_globeTexture"
		);
		const globeNormal = this.gl.getUniformLocation(
			this.glProgram,
			"u_globeNormal"
		);
		const lightPosition = this.gl.getUniformLocation(
			this.glProgram,
			"u_lightPosition"
		);

		if (
			!projectionMatrix ||
			!viewMatrix ||
			!modelMatrix ||
			!normalMatrix ||
			!globeTexture ||
			!globeNormal ||
			!lightPosition
		) {
			throw new Error("When getting uniform locations");
		}

		// store uniform locations
		this.uniforms = {
			projectionMatrix,
			modelMatrix,
			viewMatrix,
			normalMatrix,
			globeTexture,
			globeNormal,
			lightPosition
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

	async initializeTexture() {
		this.earthTexture = await loadTexture(this.gl, EARTH_TEXTURE_PATH);
		this.earthNormal = await loadTexture(this.gl, EARTH_NORMAL_PATH);
		this.moonTexture = await loadTexture(this.gl, WHITE_TEXTURE_PATH);
		this.moonNormal = await loadTexture(this.gl, SMOOTH_NORMAL_PATH);

		this.gl.uniform1i(this.uniforms.globeTexture, GLOBE_TEXTURE_INDEX);
		this.gl.uniform1i(this.uniforms.globeNormal, GLOBE_NORMAL_INDEX);
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

		// consistent for both earth and moon

		this.gl.viewport(0, 0, this.targetWidth, this.targetHeight);
		this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

		this.sphere.enableAttributes(this.gl, this.vbo, this.attributes);

		const viewMatrix = Mat4.create();
		Mat4.lookAt(viewMatrix, [0.0, 1.0, 5.0], [0.0, 0.0, 0.0], [0.0, -1.0, 0.0]);
		this.gl.uniformMatrix4fv(this.uniforms.viewMatrix, false, viewMatrix);

		const lightX =
			5.0 * Math.cos((2.0 * Math.PI * (Date.now() % 10000)) / 10000);
		const lightY =
			5.0 * Math.sin((2.0 * Math.PI * (Date.now() % 10000)) / 10000);
		this.gl.uniform3fv(this.uniforms.lightPosition, [
			lightX + 10.0,
			lightY + 10.0,
			20.0
		]);

		this.gl.uniform1i(this.uniforms.globeTexture, GLOBE_TEXTURE_INDEX);
		this.gl.uniform1i(this.uniforms.globeNormal, GLOBE_NORMAL_INDEX);

		const modelMatrix = Mat4.create();
		const modelViewMatrix = Mat4.create();
		const normalMatrix = new Float32Array(9); // 3x3 matrix

		// earth

		const upright = Mat4.rotation("x", Math.PI / 2);
		const upright2 = Mat4.rotation("z", Math.PI);
		Mat4.multiply(upright, upright2, upright);
		const spin = Mat4.rotation(
			"y",
			(2.0 * Math.PI * (Date.now() % 30000)) / 30000
		);
		Mat4.multiply(modelMatrix, spin, upright);
		this.gl.uniformMatrix4fv(this.uniforms.modelMatrix, false, modelMatrix);

		Mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
		Mat4.inverseTranspose3x3(normalMatrix, modelViewMatrix);
		this.gl.uniformMatrix3fv(this.uniforms.normalMatrix, false, normalMatrix);

		this.gl.activeTexture(this.gl.TEXTURE0 + GLOBE_TEXTURE_INDEX);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.earthTexture);
		this.gl.activeTexture(this.gl.TEXTURE0 + GLOBE_NORMAL_INDEX);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.earthNormal);

		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ibo);
		this.gl.drawElements(
			this.gl.TRIANGLES,
			this.sphere.indices.length,
			this.gl.UNSIGNED_SHORT,
			0
		);

		// moon

		const moonX =
			2.0 * Math.cos((2.0 * Math.PI * (Date.now() % 10000)) / 10000);
		const moonZ =
			2.0 * Math.sin((2.0 * Math.PI * (Date.now() % 10000)) / 10000);
		Mat4.multiply(
			modelMatrix,
			Mat4.translation(moonX, 0.0, moonZ),
			Mat4.scale(0.27, 0.27, 0.27)
		);
		this.gl.uniformMatrix4fv(this.uniforms.modelMatrix, false, modelMatrix);

		Mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
		Mat4.inverseTranspose3x3(normalMatrix, modelViewMatrix);
		this.gl.uniformMatrix3fv(this.uniforms.normalMatrix, false, normalMatrix);

		this.gl.activeTexture(this.gl.TEXTURE0 + GLOBE_TEXTURE_INDEX);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.moonTexture);
		this.gl.activeTexture(this.gl.TEXTURE0 + GLOBE_NORMAL_INDEX);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.moonNormal);

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
