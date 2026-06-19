import VERTEX_SHADER from "../shaders/cube.vert" with { type: "text" };
import FRAGMENT_SHADER from "../shaders/cube.frag" with { type: "text" };

import {
	TEXTURES,
	CUBE_TEXTURE_INDEX,
	CUBE_TEXTURE,
	CUBE_NORMAL_INDEX,
	CUBE_NORMAL
} from "../textures.ts";
import {
	compileProgram,
	getAttribLocations,
	getUniformLocations,
	Program
} from "../program.ts";
import { Mat4 } from "../math.ts";
import { CubeMesh } from "../meshes/cube.ts";

class CubeProgram extends Program {
	private attributes: Record<string, number>;
	private uniforms: Record<string, WebGLUniformLocation>;

	private vbo: WebGLBuffer;

	private cube: CubeMesh;

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
			cubeTexture: "u_cubeTexture",
			cubeNormal: "u_cubeNormal"
		});

		this.vbo = this.gl.createBuffer();
		if (!this.vbo) {
			throw new Error("When creating vertex buffer");
		}

		this.gl.useProgram(this.glProgram);
		this.gl.uniform1i(this.uniforms.cubeTexture, CUBE_TEXTURE_INDEX);
		this.gl.uniform1i(this.uniforms.cubeNormal, CUBE_NORMAL_INDEX);

		this.cube = new CubeMesh();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
		this.gl.bufferData(
			this.gl.ARRAY_BUFFER,
			this.cube.data(),
			this.gl.DYNAMIC_DRAW
		);
	}

	draw(projectionMatrix: Float32Array) {
		this.gl.useProgram(this.glProgram);

		this.gl.uniformMatrix4fv(
			this.uniforms.projectionMatrix,
			false,
			projectionMatrix
		);

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

		this.gl.activeTexture(this.gl.TEXTURE0 + CUBE_TEXTURE_INDEX);
		this.gl.bindTexture(this.gl.TEXTURE_2D, TEXTURES[CUBE_TEXTURE]);

		this.gl.activeTexture(this.gl.TEXTURE0 + CUBE_NORMAL_INDEX);
		this.gl.bindTexture(this.gl.TEXTURE_2D, TEXTURES[CUBE_NORMAL]);

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
		this.gl.drawArrays(this.gl.TRIANGLES, 0, CubeMesh.NUM_VERTICES);
	}
}

export { CubeProgram };
