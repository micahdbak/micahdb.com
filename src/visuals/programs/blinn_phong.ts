import VERTEX_SHADER from "@/shaders/blinn_phong.vert" with { type: "text" };
import FRAGMENT_SHADER from "@/shaders/blinn_phong.frag" with { type: "text" };

import { compileProgram, getAttribLocations, getUniformLocations } from "@/shader.ts";
import { Mat4 } from "@/math.ts";
import { TriangleMesh } from "@/visuals/meshes/mesh.ts";

import { Program } from "./program.ts";

export class BlinnPhongProgram extends Program {
	private mesh: TriangleMesh;

	private attributes: Record<string, number>;
	private uniforms: Record<string, WebGLUniformLocation>;

	private vbo: WebGLBuffer;

	init(mesh: TriangleMesh) {
		this.mesh = mesh;

		const gl = this.gl;
		this.gl_program = compileProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);

		this.attributes = getAttribLocations(gl, this.gl_program, {
			position: "a_position",
			normal: "a_normal",
			tangent: "a_tangent",
			uv_coord: "a_uv_coord"
		});

		this.uniforms = getUniformLocations(gl, this.gl_program, {
			projection_matrix: "u_projection_matrix",
			view_matrix: "u_view_matrix",
			model_matrix: "u_model_matrix",
			normal_matrix: "u_normal_matrix",
			texture: "u_texture",
			normal: "u_normal",
			roughness: "u_roughness",
			light_position: "u_light_position"
		});

		this.vbo = gl.createBuffer();
		if (!this.vbo) {
			throw new Error("When creating vertex buffer");
		}

		gl.useProgram(this.gl_program);
		gl.uniform1i(this.uniforms.texture, 0);
		gl.uniform1i(this.uniforms.normal, 1);
		gl.uniform1i(this.uniforms.roughness, 2);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.bufferData(gl.ARRAY_BUFFER, this.mesh.data(), gl.DYNAMIC_DRAW);
	}

	draw(
		texture: WebGLTexture,
		normal: WebGLTexture,
		roughness: WebGLTexture,
		model_matrix: Float32Array,
		view_matrix: Float32Array,
		projection_matrix: Float32Array,
		light_position: number[]
	) {
		const gl = this.gl;
		gl.useProgram(this.gl_program);

		gl.uniformMatrix4fv(this.uniforms.projection_matrix, false, projection_matrix);
		gl.uniformMatrix4fv(this.uniforms.view_matrix, false, view_matrix);
		gl.uniformMatrix4fv(this.uniforms.model_matrix, false, model_matrix);

		const normal_matrix = new Float32Array(9); // 3x3 matrix
		const model_view_matrix = Mat4.create();
		Mat4.multiply(model_view_matrix, view_matrix, model_matrix);
		Mat4.inverseTranspose3x3(normal_matrix, model_view_matrix);
		gl.uniformMatrix3fv(this.uniforms.normal_matrix, false, normal_matrix);

		gl.uniform3fv(this.uniforms.light_position, light_position);

		this.mesh.enableAttributes(gl, this.vbo, this.attributes);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, normal);
		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, roughness);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.drawArrays(gl.TRIANGLES, 0, this.mesh.positions.length / 3);
	}
}

export { CubeProgram };
