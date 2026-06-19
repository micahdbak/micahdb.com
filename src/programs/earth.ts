import VERTEX_SHADER from "../shaders/sphere.vert" with { type: "text" };
import FRAGMENT_SHADER from "../shaders/sphere.frag" with { type: "text" };

import {
	TEXTURES,
	SPHERE_TEXTURE_INDEX,
	SPHERE_NORMAL_INDEX,
	EARTH_TEXTURE,
	EARTH_NORMAL,
	MOON_TEXTURE,
	MOON_NORMAL
} from "../textures.ts";
import {
	compileProgram,
	getAttribLocations,
	getUniformLocations,
	Program
} from "../program.ts";
import { Mat4 } from "../math.ts";
import { SphereMesh } from "../meshes/sphere.ts";

export class EarthProgram extends Program {
	private attributes: Record<string, number>;
	private uniforms: Record<string, WebGLUniformLocation>;

	private vbo: WebGLBuffer;
	private ibo: WebGLBuffer;

	private sphere: SphereMesh;

	init() {
		this.glProgram = compileProgram(this.gl, VERTEX_SHADER, FRAGMENT_SHADER);

		this.attributes = getAttribLocations(this.gl, this.glProgram, {
			position: "a_position",
			normal: "a_normal",
			tangent: "a_tangent",
			uvCoord: "a_uvCoord"
		});

		this.uniforms = getUniformLocations(this.gl, this.glProgram, {
			projectionMatrix: "u_projectionMatrix",
			viewMatrix: "u_viewMatrix",
			modelMatrix: "u_modelMatrix",
			normalMatrix: "u_normalMatrix",
			sphereTexture: "u_sphereTexture",
			sphereNormal: "u_sphereNormal",
			lightPosition: "u_lightPosition"
		});

		this.vbo = this.gl.createBuffer();
		if (!this.vbo) {
			throw new Error("When creating vertex buffer");
		}

		this.ibo = this.gl.createBuffer();
		if (!this.ibo) {
			throw new Error("When creating index buffer");
		}

		this.gl.useProgram(this.glProgram);
		this.gl.uniform1i(this.uniforms.sphereTexture, SPHERE_TEXTURE_INDEX);
		this.gl.uniform1i(this.uniforms.sphereNormal, SPHERE_NORMAL_INDEX);

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
		this.gl.bindTexture(this.gl.TEXTURE_2D, TEXTURES[EARTH_TEXTURE]);
		this.gl.activeTexture(this.gl.TEXTURE0 + SPHERE_NORMAL_INDEX);
		this.gl.bindTexture(this.gl.TEXTURE_2D, TEXTURES[EARTH_NORMAL]);

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
		this.gl.bindTexture(this.gl.TEXTURE_2D, TEXTURES[MOON_TEXTURE]);
		this.gl.activeTexture(this.gl.TEXTURE0 + SPHERE_NORMAL_INDEX);
		this.gl.bindTexture(this.gl.TEXTURE_2D, TEXTURES[MOON_NORMAL]);

		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ibo);
		this.gl.drawElements(
			this.gl.TRIANGLES,
			this.sphere.indices.length,
			this.gl.UNSIGNED_SHORT,
			0
		);
	}
}
