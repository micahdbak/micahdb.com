import * as tscon from "@micahdb/tscon";

import { Visuals } from "./visuals.ts";
import { SkyboxProgram } from "./programs/skybox.ts";

export class NebulaeVisuals extends Visuals {
	static readonly ORBIT_PERIOD = 150;

	private yaw: number;
	private pitch: number;

	private skybox!: SkyboxProgram;

	private cubemap!: WebGLTexture;

	constructor(canvas: tscon.Canvas) {
		super(canvas);
		this.yaw = 0;
		this.pitch = 0;
	}

	async init() {
		const gl = this.canvas.gl;

		this.skybox = new SkyboxProgram(gl);

		this.cubemap = await tscon.loadCubeMap(gl, [
			"/images/nebulae/right.png",
			"/images/nebulae/left.png",
			"/images/nebulae/top.png",
			"/images/nebulae/bottom.png",
			"/images/nebulae/front.png",
			"/images/nebulae/back.png"
		]);

		if (this.cubemap !== null) {
			this.is_ready = true;
		}
	}

	draw(projection_matrix: Float32Array, elapsed: number, delta: number) {
		const base_yaw_half = Math.PI / 36;
		const base_pitch_half = Math.PI / 18;
		const range_delta = base_pitch_half - base_yaw_half;

		// 1:2 cells -> 2 cols == 1 row physically; >1 wide, <1 tall.
		const aspect = (this.canvas.cols * tscon.Canvas.CELL_WIDTH)
			/ (this.canvas.rows * tscon.Canvas.CELL_HEIGHT);
		const tallness = 1 / (1 + aspect);

		const yaw_half_range = base_yaw_half + range_delta * tallness;
		const pitch_half_range = base_pitch_half - range_delta * tallness;

		const target_yaw =
			((this.canvas.mouse_col ?? 0) / this.canvas.cols - 0.5) * 2.0 * yaw_half_range;
		const target_pitch =
			((this.canvas.mouse_row ?? 0) / this.canvas.rows - 0.5) * 2.0 * pitch_half_range;

		const k = 4;
		const alpha = 1 - Math.exp(-k * delta);

		this.yaw += (target_yaw - this.yaw) * alpha;
		this.pitch += (target_pitch - this.pitch) * alpha;

		const cycle =
			(2.0 * Math.PI * (elapsed % NebulaeVisuals.ORBIT_PERIOD)) / NebulaeVisuals.ORBIT_PERIOD;
		const view_x = 5.0 * Math.cos(cycle);
		const view_z = 5.0 * Math.sin(cycle);

		const view_matrix = tscon.Mat4.create();
		tscon.Mat4.lookAt(
			view_matrix,
			new Float32Array([view_x, 0.5, view_z]),
			new Float32Array([0.0, 0.0, 0.0]),
			new Float32Array([0.0, -1.0, 0.0])
		);

		const yaw_matrix = tscon.Mat4.rotation("y", this.yaw);
		const pitch_matrix = tscon.Mat4.rotation("x", -this.pitch);

		const offset_matrix = tscon.Mat4.create();
		tscon.Mat4.multiply(offset_matrix, yaw_matrix, pitch_matrix);

		const final_view_matrix = tscon.Mat4.create();
		tscon.Mat4.multiply(final_view_matrix, offset_matrix, view_matrix);

		this.skybox.draw(this.cubemap, projection_matrix, final_view_matrix);
	}
}
