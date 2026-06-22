import VERTEX_SHADER from "../shaders/cube.vert" with { type: "text" };
import FRAGMENT_SHADER from "../shaders/cube.frag" with { type: "text" };

import {
	TEXTURES,
	CUBE_TEXTURE_INDEX,
	CUBE_TEXTURE,
	CUBE_NORMAL_INDEX,
	CUBE_NORMAL
} from "../textures.ts";
import { compileProgram, getAttribLocations, getUniformLocations, Program } from "../program.ts";
import { Mat4 } from "../math.ts";
import { CubeMesh } from "../meshes/cube.ts";

class CubeProgram extends Program {
	private attributes: Record<string, number>;
	private uniforms: Record<string, WebGLUniformLocation>;

	private vbo: WebGLBuffer;

	private cube: CubeMesh;

	init() {
		this.gl_program = compileProgram(this.gl, VERTEX_SHADER, FRAGMENT_SHADER);

		this.attributes = getAttribLocations(this.gl, this.gl_program, {
			position: "a_position",
			normal: "a_normal",
			tangent: "a_tangent",
			uv_coord: "a_uv_coord"
		});

		this.uniforms = getUniformLocations(this.gl, this.gl_program, {
			projection_matrix: "u_projection_matrix",
			view_matrix: "u_view_matrix",
			model_matrix: "u_model_matrix",
			normal_matrix: "u_normal_matrix",
			cube_texture: "u_cube_texture",
			cube_normal: "u_cube_normal"
		});

		this.vbo = this.gl.createBuffer();
		if (!this.vbo) {
			throw new Error("When creating vertex buffer");
		}

		this.gl.useProgram(this.gl_program);
		this.gl.uniform1i(this.uniforms.cube_texture, CUBE_TEXTURE_INDEX);
		this.gl.uniform1i(this.uniforms.cube_normal, CUBE_NORMAL_INDEX);

		this.cube = new CubeMesh();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.cube.data(), this.gl.DYNAMIC_DRAW);
	}

	draw(projection_matrix: Float32Array) {
		this.gl.useProgram(this.gl_program);

		this.gl.uniformMatrix4fv(this.uniforms.projection_matrix, false, projection_matrix);

		const view_matrix = Mat4.create();
		Mat4.lookAt(view_matrix, [0.0, 3.0, 4.0], [0.0, 0.0, 0.0], [0.0, -1.0, 0.0]);
		this.gl.uniformMatrix4fv(this.uniforms.view_matrix, false, view_matrix);

		const rotate_x = Mat4.rotation("z", (2.0 * Math.PI * (Date.now() % 5000)) / 5000);
		const rotate_y = Mat4.rotation("x", (2.0 * Math.PI * (Date.now() % 6000)) / 6000);
		const rotate_z = Mat4.rotation("y", (2.0 * Math.PI * (Date.now() % 7000)) / 7000);
		const model_matrix = Mat4.create();
		Mat4.multiply(model_matrix, rotate_x, rotate_y);
		Mat4.multiply(model_matrix, model_matrix, rotate_z);
		this.gl.uniformMatrix4fv(this.uniforms.model_matrix, false, model_matrix);

		const normal_matrix = new Float32Array(9); // 3x3 matrix
		const model_view_matrix = Mat4.create();
		Mat4.multiply(model_view_matrix, view_matrix, model_matrix);
		Mat4.inverseTranspose3x3(normal_matrix, model_view_matrix);
		this.gl.uniformMatrix3fv(this.uniforms.normal_matrix, false, normal_matrix);

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
