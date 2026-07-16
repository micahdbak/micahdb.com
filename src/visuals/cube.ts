import { Mat4 } from "./math.ts";
import { CubeProgram } from "./programs/cube";
import { loadTexture } from "./textures.ts";
import { Visuals } from "./visuals.ts";
import { Canvas } from "../canvas.ts";

export class CubeVisuals extends Visuals {
	static readonly YAW_HALF_RANGE = Math.PI / 3;
	static readonly PITCH_HALF_RANGE = Math.PI / 3;
	static readonly TRACKING_K = 4;

	private cube: CubeProgram;

	private cube_texture: WebGLTexture;
	private cube_normal: WebGLTexture;

	private yaw: number;
	private pitch: number;

	constructor(canvas: Canvas) {
		super(canvas);
		this.yaw = 0;
		this.pitch = 0;
	}

	async init() {
		const gl = this.canvas.gl;

		this.cube = new CubeProgram(gl);
		this.cube.init();

		[this.cube_texture, this.cube_normal] = await Promise.all([
			loadTexture(gl, "/images/white.png"),
			loadTexture(gl, "/images/smooth.png")
		]);

		this.is_ready = true;
	}

	draw(projection_matrix: Float32Array, elapsed: number, delta: number) {
		void elapsed; // unused

		// map cursor position to a target yaw/pitch, then smoothly track it
		const target_yaw =
			((this.canvas.mouse_col ?? 0) / this.canvas.cols - 0.5) * 2.0 * CubeVisuals.YAW_HALF_RANGE;
		const target_pitch =
			((this.canvas.mouse_row ?? 0) / this.canvas.rows - 0.5) * 2.0 * CubeVisuals.PITCH_HALF_RANGE;

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

		this.cube.draw(
			this.cube_texture,
			this.cube_normal,
			model_matrix,
			view_matrix,
			projection_matrix
		);
	}
}
