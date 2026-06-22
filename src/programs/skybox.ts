import VERTEX_SHADER from "../shaders/skybox.vert" with { type: "text" };
import FRAGMENT_SHADER from "../shaders/skybox.frag" with { type: "text" };

import { TEXTURES, EARTH_CUBEMAP, SKYBOX_TEXTURE_INDEX } from "../textures.ts";
import { compileProgram, getAttribLocations, getUniformLocations, Program } from "../program.ts";
import { CubeMesh } from "../meshes/cube.ts";

export class SkyboxProgram extends Program {
	private attributes: Record<string, number>;
	private uniforms: Record<string, WebGLUniformLocation>;

	private vbo: WebGLBuffer;
	private cube: CubeMesh;

	init() {
		this.gl_program = compileProgram(this.gl, VERTEX_SHADER, FRAGMENT_SHADER);

		this.attributes = getAttribLocations(this.gl, this.gl_program, {
			position: "a_position"
		});

		this.uniforms = getUniformLocations(this.gl, this.gl_program, {
			projection_matrix: "u_projection_matrix",
			view_matrix: "u_view_matrix",
			skybox_texture: "u_skybox_texture"
		});

		this.vbo = this.gl.createBuffer();
		if (!this.vbo) {
			throw new Error("When creating vertex buffer");
		}

		this.gl.useProgram(this.gl_program);
		this.gl.uniform1i(this.uniforms.skybox_texture, SKYBOX_TEXTURE_INDEX);

		this.cube = new CubeMesh();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.cube.data(), this.gl.STATIC_DRAW);
	}

	draw(projection_matrix: Float32Array, view_matrix: Float32Array) {
		this.gl.useProgram(this.gl_program);

		this.gl.depthFunc(this.gl.LEQUAL);

		this.gl.uniformMatrix4fv(this.uniforms.projection_matrix, false, projection_matrix);
		this.gl.uniformMatrix4fv(this.uniforms.view_matrix, false, view_matrix);

		this.gl.activeTexture(this.gl.TEXTURE0 + SKYBOX_TEXTURE_INDEX);
		this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, TEXTURES[EARTH_CUBEMAP]);
		this.gl.uniform1i(this.uniforms.skybox_texture, SKYBOX_TEXTURE_INDEX);

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
		this.gl.vertexAttribPointer(this.attributes.position, 3, this.gl.FLOAT, false, 44, 0);
		this.gl.enableVertexAttribArray(this.attributes.position);

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
		this.gl.drawArrays(this.gl.TRIANGLES, 0, CubeMesh.NUM_VERTICES);

		this.gl.depthFunc(this.gl.LESS);
	}
}
