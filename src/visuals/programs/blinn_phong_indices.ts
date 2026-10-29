import * as tscon from "@micahdb/tscon";
import VERTEX_SHADER from "@/shaders/blinn_phong.vert" with { type: "text" };
import FRAGMENT_SHADER from "@/shaders/blinn_phong.frag" with { type: "text" };

import { TriangleIndicesMesh } from "@/visuals/meshes/mesh.ts";

import { Program } from "./program.ts";

export class BlinnPhongIndicesProgram extends Program {
	private readonly mesh: TriangleIndicesMesh;

	private readonly attributes: {
		position: number;
		normal: number;
		tangent: number;
		uv_coord: number;
	};
	private readonly uniforms: {
		projection_matrix: WebGLUniformLocation;
		view_matrix: WebGLUniformLocation;
		model_matrix: WebGLUniformLocation;
		normal_matrix: WebGLUniformLocation;
		texture: WebGLUniformLocation;
		normal: WebGLUniformLocation;
		roughness: WebGLUniformLocation;
		light_position: WebGLUniformLocation;
		ambient: WebGLUniformLocation;
		light_intensity: WebGLUniformLocation;
	};

	private readonly vbo: WebGLBuffer;
	private readonly ibo: WebGLBuffer;

	constructor(gl: WebGL2RenderingContext, mesh: TriangleIndicesMesh) {
		super(gl, tscon.compileProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER));

		this.mesh = mesh;

		this.attributes = tscon.getAttribLocations(gl, this.gl_program, {
			position: "a_position",
			normal: "a_normal",
			tangent: "a_tangent",
			uv_coord: "a_uv_coord"
		}) as typeof this.attributes;

		this.uniforms = tscon.getUniformLocations(gl, this.gl_program, {
			projection_matrix: "u_projection_matrix",
			view_matrix: "u_view_matrix",
			model_matrix: "u_model_matrix",
			normal_matrix: "u_normal_matrix",
			texture: "u_texture",
			normal: "u_normal",
			roughness: "u_roughness",
			light_position: "u_light_position",
			ambient: "u_ambient",
			light_intensity: "u_light_intensity"
		}) as typeof this.uniforms;

		const vbo = gl.createBuffer();
		if (!vbo) {
			throw new Error("When creating vertex buffer");
		}
		this.vbo = vbo;

		const ibo = gl.createBuffer();
		if (!ibo) {
			throw new Error("When creating index buffer");
		}
		this.ibo = ibo;

		gl.useProgram(this.gl_program);
		gl.uniform1i(this.uniforms.texture, 0);
		gl.uniform1i(this.uniforms.normal, 1);
		gl.uniform1i(this.uniforms.roughness, 2);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.bufferData(gl.ARRAY_BUFFER, this.mesh.data(), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.mesh.indices), gl.STATIC_DRAW);
	}

	draw(
		texture: WebGLTexture,
		normal: WebGLTexture,
		roughness: WebGLTexture,
		model_matrix: Float32Array,
		view_matrix: Float32Array,
		projection_matrix: Float32Array,
		ambient: number,
		light_position: number[],
		light_intensity: number
	) {
		const gl = this.gl;
		gl.useProgram(this.gl_program);

		this.mesh.enableAttributes(gl, this.vbo, this.attributes);

		gl.uniformMatrix4fv(this.uniforms.projection_matrix, false, projection_matrix);
		gl.uniformMatrix4fv(this.uniforms.view_matrix, false, view_matrix);
		gl.uniformMatrix4fv(this.uniforms.model_matrix, false, model_matrix);

		const model_view_matrix = tscon.Mat4.create();
		tscon.Mat4.multiply(model_view_matrix, view_matrix, model_matrix);
		const normal_matrix = new Float32Array(9); // 3x3 matrix
		tscon.Mat4.inverseTranspose3x3(normal_matrix, model_view_matrix);
		gl.uniformMatrix3fv(this.uniforms.normal_matrix, false, normal_matrix);

		gl.uniform3fv(this.uniforms.light_position, light_position);
		gl.uniform1f(this.uniforms.ambient, ambient);
		gl.uniform1f(this.uniforms.light_intensity, light_intensity);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, normal);
		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, roughness);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
		gl.drawElements(gl.TRIANGLES, this.mesh.indices.length, gl.UNSIGNED_INT, 0);
	}
}
