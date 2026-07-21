import { Canvas } from "@/canvas.ts";
import { loadTexture } from "@/texture.ts";
import { Mat4 } from "@/math.ts";

import { Visuals } from "./visuals.ts";
import { TorusProgram } from "./programs/torus";

export class TorusVisuals extends Visuals {
	static readonly YAW_HALF_RANGE = Math.PI / 3;
	static readonly PITCH_HALF_RANGE = Math.PI / 3;
	static readonly TRACKING_K = 4;

	private torus: TorusProgram;

	private torus_texture: WebGLTexture;
	private torus_normal: WebGLTexture;

	private yaw: number;
	private pitch: number;

	constructor(canvas: Canvas) {
		super(canvas);
		this.yaw = 0;
		this.pitch = 0;
	}

	async init() {
		const gl = this.canvas.gl;

		this.torus = new TorusProgram(gl);
		this.torus.init();

		[this.torus_texture, this.torus_normal] = await Promise.all([
			loadTexture(gl, "/images/torus/texture.jpg"),
			loadTexture(gl, "/images/torus/normal.jpg")
		]);

		this.is_ready = true;
	}

	draw(projection_matrix: Float32Array, elapsed: number, delta: number) {
		void elapsed; // unused

		const default_col = this.canvas.cols / 2;
		const default_row = this.canvas.rows / 2;

		// camera placed in front of the origin, looking at the torus's front face
		const view_matrix = Mat4.create();
		Mat4.lookAt(view_matrix, [0.0, 0.0, 4.0], [0.0, 0.0, 0.0], [0.0, -1.0, 0.0]);

		// rotate the torus so its front face tracks the cursor
		const ry = Mat4.rotation("y", elapsed / 1.7);
		const rx = Mat4.rotation("x", elapsed / 1.9);
		const rz = Mat4.rotation("z", elapsed / 2.3);

		const tmp = Mat4.create();
		Mat4.multiply(tmp, ry, rx);

		const model_matrix = Mat4.create();
		Mat4.multiply(model_matrix, tmp, rz);

		this.torus.draw(
			this.torus_texture,
			this.torus_normal,
			model_matrix,
			view_matrix,
			projection_matrix,
			[0.0, 1.0, 0.5]
		);
	}
}
