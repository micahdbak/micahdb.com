import VERTEX_SHADER from "@/shaders/skybox.vert" with { type: "text" };
import FRAGMENT_SHADER from "@/shaders/skybox.frag" with { type: "text" };

import { compileProgram, getAttribLocations, getUniformLocations } from "@creat/tscon";
import { TriangleMesh } from "@/visuals/meshes/mesh.ts";
import { cubeMesh } from "@/visuals/meshes/cube.ts";

import { Program } from "./program.ts";

export class SkyboxProgram extends Program {
	private cube_mesh: TriangleMesh;

	private attributes: Record<string, number>;
	private uniforms: Record<string, WebGLUniformLocation>;

	private vbo: WebGLBuffer;

	init() {
		this.cube_mesh = cubeMesh();

		const gl = this.gl;
		this.gl_program = compileProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);

		this.attributes = getAttribLocations(gl, this.gl_program, {
			position: "a_position"
		});

		this.uniforms = getUniformLocations(gl, this.gl_program, {
			projection_matrix: "u_projection_matrix",
			view_matrix: "u_view_matrix",
			skybox_texture: "u_skybox_texture"
		});

		this.vbo = gl.createBuffer();
		if (!this.vbo) {
			throw new Error("When creating vertex buffer");
		}

		gl.useProgram(this.gl_program);
		gl.uniform1i(this.uniforms.skybox_texture, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.bufferData(gl.ARRAY_BUFFER, this.cube_mesh.data(), gl.STATIC_DRAW);
	}

	draw(texture: WebGLTexture, projection_matrix: Float32Array, view_matrix: Float32Array) {
		const gl = this.gl;
		gl.useProgram(this.gl_program);

		gl.depthFunc(gl.LEQUAL);

		gl.uniformMatrix4fv(this.uniforms.projection_matrix, false, projection_matrix);
		gl.uniformMatrix4fv(this.uniforms.view_matrix, false, view_matrix);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
		gl.uniform1i(this.uniforms.skybox_texture, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.vertexAttribPointer(this.attributes.position, 3, gl.FLOAT, false, 44, 0);
		gl.enableVertexAttribArray(this.attributes.position);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.drawArrays(gl.TRIANGLES, 0, this.cube_mesh.positions.length / 3);

		gl.depthFunc(gl.LESS);
	}
}
