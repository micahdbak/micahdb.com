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
import { compileProgram, getAttribLocations, getUniformLocations, Program } from "../program.ts";
import { Mat4 } from "../math.ts";
import { SphereMesh } from "../meshes/sphere.ts";

export class EarthProgram extends Program {
	private attributes: Record<string, number>;
	private uniforms: Record<string, WebGLUniformLocation>;

	private vbo: WebGLBuffer;
	private ibo: WebGLBuffer;

	private sphere: SphereMesh;

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
			sphere_texture: "u_sphere_texture",
			sphere_normal: "u_sphere_normal",
			light_position: "u_light_position"
		});

		this.vbo = this.gl.createBuffer();
		if (!this.vbo) {
			throw new Error("When creating vertex buffer");
		}

		this.ibo = this.gl.createBuffer();
		if (!this.ibo) {
			throw new Error("When creating index buffer");
		}

		this.gl.useProgram(this.gl_program);
		this.gl.uniform1i(this.uniforms.sphere_texture, SPHERE_TEXTURE_INDEX);
		this.gl.uniform1i(this.uniforms.sphere_normal, SPHERE_NORMAL_INDEX);

		this.sphere = new SphereMesh(7, 15);

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.sphere.data(), this.gl.STATIC_DRAW);
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ibo);
		this.gl.bufferData(
			this.gl.ELEMENT_ARRAY_BUFFER,
			new Uint16Array(this.sphere.indices),
			this.gl.STATIC_DRAW
		);
	}

	draw(projection_matrix: Float32Array, view_matrix: Float32Array) {
		this.gl.useProgram(this.gl_program);

		// consistent for both earth and moon

		this.sphere.enableAttributes(this.gl, this.vbo, this.attributes);

		this.gl.uniformMatrix4fv(this.uniforms.projection_matrix, false, projection_matrix);

		this.gl.uniformMatrix4fv(this.uniforms.view_matrix, false, view_matrix);

		this.gl.uniform3fv(this.uniforms.light_position, [1.0, 0.1, 0.0]);

		this.gl.uniform1i(this.uniforms.sphere_texture, SPHERE_TEXTURE_INDEX);
		this.gl.uniform1i(this.uniforms.sphere_normal, SPHERE_NORMAL_INDEX);

		const model_matrix = Mat4.create();
		const model_view_matrix = Mat4.create();
		const normal_matrix = new Float32Array(9); // 3x3 matrix

		// earth

		const upright = Mat4.rotation("x", Math.PI / 2);
		const upright2 = Mat4.rotation("z", Math.PI);
		Mat4.multiply(upright, upright2, upright);
		const spin = Mat4.rotation("y", (2.0 * Math.PI * (Date.now() % 30000)) / 30000);
		Mat4.multiply(model_matrix, spin, upright);
		this.gl.uniformMatrix4fv(this.uniforms.model_matrix, false, model_matrix);

		Mat4.multiply(model_view_matrix, view_matrix, model_matrix);
		Mat4.inverseTranspose3x3(normal_matrix, model_view_matrix);
		this.gl.uniformMatrix3fv(this.uniforms.normal_matrix, false, normal_matrix);

		this.gl.activeTexture(this.gl.TEXTURE0 + SPHERE_TEXTURE_INDEX);
		this.gl.bindTexture(this.gl.TEXTURE_2D, TEXTURES[EARTH_TEXTURE]);
		this.gl.activeTexture(this.gl.TEXTURE0 + SPHERE_NORMAL_INDEX);
		this.gl.bindTexture(this.gl.TEXTURE_2D, TEXTURES[EARTH_NORMAL]);

		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ibo);
		this.gl.drawElements(this.gl.TRIANGLES, this.sphere.indices.length, this.gl.UNSIGNED_SHORT, 0);

		// moon

		const moon_angle = (2.0 * Math.PI * (Date.now() % 25000)) / 25000;
		const moon_x = 3.0 * Math.cos(moon_angle);
		const moon_z = 3.0 * Math.sin(moon_angle);
		Mat4.multiply(
			model_matrix,
			Mat4.translation(moon_x, 0.0, moon_z),
			Mat4.rotation("y", -moon_angle)
		);
		Mat4.multiply(model_matrix, model_matrix, Mat4.scale(0.27, 0.27, 0.27));
		this.gl.uniformMatrix4fv(this.uniforms.model_matrix, false, model_matrix);

		Mat4.multiply(model_view_matrix, view_matrix, model_matrix);
		Mat4.inverseTranspose3x3(normal_matrix, model_view_matrix);
		this.gl.uniformMatrix3fv(this.uniforms.normal_matrix, false, normal_matrix);

		this.gl.activeTexture(this.gl.TEXTURE0 + SPHERE_TEXTURE_INDEX);
		this.gl.bindTexture(this.gl.TEXTURE_2D, TEXTURES[MOON_TEXTURE]);
		this.gl.activeTexture(this.gl.TEXTURE0 + SPHERE_NORMAL_INDEX);
		this.gl.bindTexture(this.gl.TEXTURE_2D, TEXTURES[MOON_NORMAL]);

		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ibo);
		this.gl.drawElements(this.gl.TRIANGLES, this.sphere.indices.length, this.gl.UNSIGNED_SHORT, 0);
	}
}
