import VERTEX_SHADER from "./cube.vert" with { type: "text" };
import FRAGMENT_SHADER from "./cube.frag" with { type: "text" };

import {
	TEXTURES,
	CUBE_TEXTURE_INDEX,
	CUBE_TEXTURE,
	CUBE_NORMAL_INDEX,
	CUBE_NORMAL
} from "../../textures.ts";
import { Program } from "../../program.ts";
import { Mat4 } from "../math.ts";
import { CubeMesh } from "../meshes/cube.ts";

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

	init() {
		this.loadProgram(VERTEX_SHADER, FRAGMENT_SHADER);
		this.initializeLocations();

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
