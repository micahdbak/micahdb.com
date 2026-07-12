import VERTEX_SHADER from "../shaders/sphere.vert" with { type: "text" };
import FRAGMENT_SHADER from "../shaders/sphere.frag" with { type: "text" };

import { loadTexture } from "../textures.ts";
import { compileProgram, getAttribLocations, getUniformLocations, Program } from "../program.ts";
import { Mat4 } from "../math.ts";
import { SphereMesh } from "../meshes/sphere.ts";

export class EarthProgram extends Program {
	private attributes: Record<string, number>;
	private uniforms: Record<string, WebGLUniformLocation>;

	private vbo: WebGLBuffer;
	private ibo: WebGLBuffer;

	private sphere: SphereMesh;

	private earth_texture: WebGLTexture;
	private earth_normal: WebGLTexture;
	private moon_texture: WebGLTexture;
	private moon_normal: WebGLTexture;

	init() {
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
			sphere_texture: "u_sphere_texture",
			sphere_normal: "u_sphere_normal",
			light_position: "u_light_position"
		});

		this.vbo = gl.createBuffer();
		if (!this.vbo) {
			throw new Error("When creating vertex buffer");
		}

		this.ibo = gl.createBuffer();
		if (!this.ibo) {
			throw new Error("When creating index buffer");
		}

		gl.useProgram(this.gl_program);
		gl.uniform1i(this.uniforms.sphere_texture, 0);
		gl.uniform1i(this.uniforms.sphere_normal, 1);

		this.sphere = new SphereMesh(7, 15);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.bufferData(gl.ARRAY_BUFFER, this.sphere.data(), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.sphere.indices), gl.STATIC_DRAW);
	}

	async load() {
		const gl = this.gl;

		const promises: Promise<WebGLTexture>[] = [];

		promises.push(loadTexture(gl, "/images/earth/texture.jpg"));
		promises.push(loadTexture(gl, "/images/earth/normal.jpg"));
		promises.push(loadTexture(gl, "/images/earth/moon_texture.jpg"));
		promises.push(loadTexture(gl, "/images/earth/moon_normal.jpg"));

		[this.earth_texture, this.earth_normal, this.moon_texture, this.moon_normal] =
			await Promise.all(promises);

		this.is_ready = true;
	}

	draw(projection_matrix: Float32Array, view_matrix: Float32Array) {
		const gl = this.gl;
		gl.useProgram(this.gl_program);

		// consistent for both earth and moon

		this.sphere.enableAttributes(gl, this.vbo, this.attributes);

		gl.uniformMatrix4fv(this.uniforms.projection_matrix, false, projection_matrix);

		gl.uniformMatrix4fv(this.uniforms.view_matrix, false, view_matrix);

		gl.uniform3fv(this.uniforms.light_position, [1.0, 0.1, 0.0]);

		const model_matrix = Mat4.create();
		const model_view_matrix = Mat4.create();
		const normal_matrix = new Float32Array(9); // 3x3 matrix

		// earth

		const upright = Mat4.rotation("x", Math.PI / 2);
		const upright2 = Mat4.rotation("z", Math.PI);
		Mat4.multiply(upright, upright2, upright);
		const spin = Mat4.rotation("y", (2.0 * Math.PI * (Date.now() % 30000)) / 30000);
		Mat4.multiply(model_matrix, spin, upright);
		gl.uniformMatrix4fv(this.uniforms.model_matrix, false, model_matrix);

		Mat4.multiply(model_view_matrix, view_matrix, model_matrix);
		Mat4.inverseTranspose3x3(normal_matrix, model_view_matrix);
		gl.uniformMatrix3fv(this.uniforms.normal_matrix, false, normal_matrix);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.earth_texture);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.earth_normal);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
		gl.drawElements(gl.TRIANGLES, this.sphere.indices.length, gl.UNSIGNED_SHORT, 0);

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
		gl.uniformMatrix4fv(this.uniforms.model_matrix, false, model_matrix);

		Mat4.multiply(model_view_matrix, view_matrix, model_matrix);
		Mat4.inverseTranspose3x3(normal_matrix, model_view_matrix);
		gl.uniformMatrix3fv(this.uniforms.normal_matrix, false, normal_matrix);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.moon_texture);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.moon_normal);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
		gl.drawElements(gl.TRIANGLES, this.sphere.indices.length, gl.UNSIGNED_SHORT, 0);
	}
}
