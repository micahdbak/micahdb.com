import { Canvas, loadTexture, Mat4 } from "@creat/tscon";

import { Visuals } from "./visuals.ts";
import { BlinnPhongProgram } from "./programs/blinn_phong.ts";
import { cubeMesh } from "./meshes/cube.ts";

export class CubeVisuals extends Visuals {
	static readonly YAW_HALF_RANGE = Math.PI / 3;
	static readonly PITCH_HALF_RANGE = Math.PI / 3;
	static readonly TRACKING_K = 4;

	private blinn_phong: BlinnPhongProgram;

	private texture: WebGLTexture;
	private normal: WebGLTexture;
	private roughness: WebGLTexture;

	private yaw: number;
	private pitch: number;

	constructor(canvas: Canvas) {
		super(canvas);
		this.yaw = 0;
		this.pitch = 0;
	}

	async init() {
		const gl = this.canvas.gl;

		this.blinn_phong = new BlinnPhongProgram(gl);
		this.blinn_phong.init(cubeMesh());

		[this.texture, this.normal, this.roughness] = await Promise.all([
			loadTexture(gl, "/images/texture.png"),
			loadTexture(gl, "/images/normal.png"),
			loadTexture(gl, "/images/roughness.png")
		]);

		this.is_ready = true;
	}

	draw(projection_matrix: Float32Array, elapsed: number, delta: number) {
		void elapsed; // unused

		const default_col = this.canvas.cols / 2;
		const default_row = this.canvas.rows / 2;

		// map cursor position to a target yaw/pitch, then smoothly track it
		const target_yaw =
			((this.canvas.mouse_col ?? default_col) / this.canvas.cols - 0.5) *
			2.0 *
			CubeVisuals.YAW_HALF_RANGE;
		const target_pitch =
			((this.canvas.mouse_row ?? default_row) / this.canvas.rows - 0.5) *
			2.0 *
			CubeVisuals.PITCH_HALF_RANGE;

		const alpha = 1 - Math.exp(-CubeVisuals.TRACKING_K * delta);
		this.yaw += (target_yaw - this.yaw) * alpha;
		this.pitch += (target_pitch - this.pitch) * alpha;

		// camera placed in front of the origin, looking at the cube's front face
		const view_matrix = Mat4.create();
		Mat4.lookAt(view_matrix, [0.0, 0.0, 8.0], [0.0, 0.0, 0.0], [0.0, -1.0, 0.0]);

		// rotate the cube so its front face tracks the cursor
		const yaw_matrix = Mat4.rotation("y", -this.yaw);
		const pitch_matrix = Mat4.rotation("x", this.pitch);
		const model_matrix = Mat4.create();
		Mat4.multiply(model_matrix, yaw_matrix, pitch_matrix);

		this.blinn_phong.draw(
			this.texture,
			this.normal,
			this.roughness,
			model_matrix,
			view_matrix,
			projection_matrix,
			[0.0, 0.5, 1.0]
		);
	}
}
