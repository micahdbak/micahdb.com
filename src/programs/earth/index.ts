import VERTEX_SHADER from "./sphere.vert" with { type: "text" };
import FRAGMENT_SHADER from "./sphere.frag" with { type: "text" };

import {
	SPHERE_TEXTURE_INDEX,
	SPHERE_NORMAL_INDEX,
	EARTH_TEXTURE_PATH,
	EARTH_NORMAL_PATH,
	MOON_TEXTURE_PATH,
	MOON_NORMAL_PATH,
	loadTexture
} from "../../textures.ts";
import { Program } from "../../program.ts";
import { Mat4 } from "../math.ts";
import { SphereMesh } from "../meshes/sphere.ts";

export class EarthProgram extends Program {
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
		sphereTexture: WebGLUniformLocation;
		sphereNormal: WebGLUniformLocation;
		lightPosition: WebGLUniformLocation;
	};

	private vbo: WebGLBuffer;
	private ibo: WebGLBuffer;

	private earthTexture: WebGLTexture;
	private earthNormal: WebGLTexture;
	private moonTexture: WebGLTexture;
	private moonNormal: WebGLTexture;

	private sphere: SphereMesh;

	async init() {
		this.loadProgram(VERTEX_SHADER, FRAGMENT_SHADER);
		this.initializeLocations();

		this.vbo = this.gl.createBuffer();
		if (!this.vbo) {
			throw new Error("When creating vertex buffer");
		}

		this.ibo = this.gl.createBuffer();
		if (!this.ibo) {
			throw new Error("When creating index buffer");
		}

		await this.initializeTexture();

		this.sphere = new SphereMesh(7, 15);

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
		this.gl.useProgram(this.glProgram);

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
		const sphereTexture = this.gl.getUniformLocation(
			this.glProgram,
			"u_sphereTexture"
		);
		const sphereNormal = this.gl.getUniformLocation(
			this.glProgram,
			"u_sphereNormal"
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
			!sphereTexture ||
			!sphereNormal ||
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
			sphereTexture,
			sphereNormal,
			lightPosition
		};
	}

	async initializeTexture() {
		this.logMessage("earth", "loading textures");
		this.earthTexture = await loadTexture(this.gl, EARTH_TEXTURE_PATH);
		this.earthNormal = await loadTexture(this.gl, EARTH_NORMAL_PATH);
		this.moonTexture = await loadTexture(this.gl, MOON_TEXTURE_PATH);
		this.moonNormal = await loadTexture(this.gl, MOON_NORMAL_PATH);
		this.logMessage("earth", "done loading textures");

		this.gl.useProgram(this.glProgram);
		this.gl.uniform1i(this.uniforms.sphereTexture, SPHERE_TEXTURE_INDEX);
		this.gl.uniform1i(this.uniforms.sphereNormal, SPHERE_NORMAL_INDEX);
	}

	draw(projectionMatrix: Float32Array, viewMatrix: Float32Array) {
		this.gl.useProgram(this.glProgram);

		// consistent for both earth and moon

		this.sphere.enableAttributes(this.gl, this.vbo, this.attributes);

		this.gl.uniformMatrix4fv(
			this.uniforms.projectionMatrix,
			false,
			projectionMatrix
		);

		this.gl.uniformMatrix4fv(this.uniforms.viewMatrix, false, viewMatrix);

		this.gl.uniform3fv(this.uniforms.lightPosition, [1.0, 0.1, 0.0]);

		this.gl.uniform1i(this.uniforms.sphereTexture, SPHERE_TEXTURE_INDEX);
		this.gl.uniform1i(this.uniforms.sphereNormal, SPHERE_NORMAL_INDEX);

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

		this.gl.activeTexture(this.gl.TEXTURE0 + SPHERE_TEXTURE_INDEX);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.earthTexture);
		this.gl.activeTexture(this.gl.TEXTURE0 + SPHERE_NORMAL_INDEX);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.earthNormal);

		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ibo);
		this.gl.drawElements(
			this.gl.TRIANGLES,
			this.sphere.indices.length,
			this.gl.UNSIGNED_SHORT,
			0
		);

		// moon

		const moonAngle = (2.0 * Math.PI * (Date.now() % 25000)) / 25000;
		const moonX = 3.0 * Math.cos(moonAngle);
		const moonZ = 3.0 * Math.sin(moonAngle);
		Mat4.multiply(
			modelMatrix,
			Mat4.translation(moonX, 0.0, moonZ),
			Mat4.rotation("y", -moonAngle)
		);
		Mat4.multiply(modelMatrix, modelMatrix, Mat4.scale(0.27, 0.27, 0.27));
		this.gl.uniformMatrix4fv(this.uniforms.modelMatrix, false, modelMatrix);

		Mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
		Mat4.inverseTranspose3x3(normalMatrix, modelViewMatrix);
		this.gl.uniformMatrix3fv(this.uniforms.normalMatrix, false, normalMatrix);

		this.gl.activeTexture(this.gl.TEXTURE0 + SPHERE_TEXTURE_INDEX);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.moonTexture);
		this.gl.activeTexture(this.gl.TEXTURE0 + SPHERE_NORMAL_INDEX);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.moonNormal);

		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ibo);
		this.gl.drawElements(
			this.gl.TRIANGLES,
			this.sphere.indices.length,
			this.gl.UNSIGNED_SHORT,
			0
		);
	}
}
