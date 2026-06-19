import VERTEX_SHADER from "../shaders/skybox.vert" with { type: "text" };
import FRAGMENT_SHADER from "../shaders/skybox.frag" with { type: "text" };

import { TEXTURES, EARTH_CUBEMAP, SKYBOX_TEXTURE_INDEX } from "../textures.ts";
import {
	compileProgram,
	getAttribLocations,
	getUniformLocations,
	Program
} from "../program.ts";
import { CubeMesh } from "../meshes/cube.ts";

export class SkyboxProgram extends Program {
	private attributes: Record<string, number>;
	private uniforms: Record<string, WebGLUniformLocation>;

	private vbo: WebGLBuffer;
	private cube: CubeMesh;

	init() {
		this.glProgram = compileProgram(this.gl, VERTEX_SHADER, FRAGMENT_SHADER);

		this.attributes = getAttribLocations(this.gl, this.glProgram, {
			position: "a_position"
		});

		this.uniforms = getUniformLocations(this.gl, this.glProgram, {
			projectionMatrix: "u_projectionMatrix",
			viewMatrix: "u_viewMatrix",
			skyboxTexture: "u_skyboxTexture"
		});

		this.vbo = this.gl.createBuffer();
		if (!this.vbo) {
			throw new Error("When creating vertex buffer");
		}

		this.gl.useProgram(this.glProgram);
		this.gl.uniform1i(this.uniforms.skyboxTexture, SKYBOX_TEXTURE_INDEX);

		this.cube = new CubeMesh();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
		this.gl.bufferData(
			this.gl.ARRAY_BUFFER,
			this.cube.data(),
			this.gl.STATIC_DRAW
		);
	}

	draw(projectionMatrix: Float32Array, viewMatrix: Float32Array) {
		this.gl.useProgram(this.glProgram);

		this.gl.depthFunc(this.gl.LEQUAL);

		this.gl.uniformMatrix4fv(
			this.uniforms.projectionMatrix,
			false,
			projectionMatrix
		);
		this.gl.uniformMatrix4fv(this.uniforms.viewMatrix, false, viewMatrix);

		this.gl.activeTexture(this.gl.TEXTURE0 + SKYBOX_TEXTURE_INDEX);
		this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, TEXTURES[EARTH_CUBEMAP]);
		this.gl.uniform1i(this.uniforms.skyboxTexture, SKYBOX_TEXTURE_INDEX);

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
		this.gl.vertexAttribPointer(
			this.attributes.position,
			3,
			this.gl.FLOAT,
			false,
			44,
			0
		);
		this.gl.enableVertexAttribArray(this.attributes.position);

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
		this.gl.drawArrays(this.gl.TRIANGLES, 0, CubeMesh.NUM_VERTICES);

		this.gl.depthFunc(this.gl.LESS);
	}
}
