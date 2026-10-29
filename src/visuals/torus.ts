import * as tscon from "@micahdb/tscon";

import { Visuals } from "./visuals.ts";
import { torusMesh } from "./meshes/torus.ts";
import { BlinnPhongIndicesProgram } from "./programs/blinn_phong_indices.ts";

export class TorusVisuals extends Visuals {
	// the light orbits the view axis, this far in front of the torus and
	// this far off it, so the ring's far inner wall is never lit and no
	// glow shows through the hole
	static readonly LIGHT_RADIUS = 4.0;
	static readonly LIGHT_DEPTH = 5.0;

	static readonly YAW_HALF_RANGE = Math.PI / 3;
	static readonly PITCH_HALF_RANGE = Math.PI / 3;
	static readonly TRACKING_K = 4;

	private blinn_phong!: BlinnPhongIndicesProgram;

	private texture!: WebGLTexture;
	private normal!: WebGLTexture;
	private roughness!: WebGLTexture;

	private yaw: number;
	private pitch: number;

	constructor(canvas: tscon.Canvas) {
		super(canvas);
		this.yaw = 0;
		this.pitch = 0;
	}

	async init() {
		const gl = this.canvas.gl;

		this.blinn_phong = new BlinnPhongIndicesProgram(gl, torusMesh(32, 24, 4, 1));

		[this.texture, this.normal, this.roughness] = await Promise.all([
			tscon.loadTexture(gl, "/images/texture.png"),
			tscon.loadTexture(gl, "/images/normal.png"),
			tscon.loadTexture(gl, "/images/roughness.png")
		]);

		this.is_ready = true;
	}

	draw(projection_matrix: Float32Array, elapsed: number, delta: number) {
		void elapsed; // unused
		void delta; // unused

		// camera placed in front of the origin, looking at the torus's front face
		const view_matrix = tscon.Mat4.create();
		tscon.Mat4.lookAt(
			view_matrix,
			new Float32Array([0.0, 0.0, 16.0]),
			new Float32Array([0.0, 0.0, 0.0]),
			new Float32Array([0.0, -1.0, 0.0])
		);

		// rotate the torus so its front face tracks the cursor
		const ry = tscon.Mat4.rotation("y", elapsed / 1.7);
		const rx = tscon.Mat4.rotation("x", elapsed / 1.9);
		const rz = tscon.Mat4.rotation("z", elapsed / 2.3);

		const tmp = tscon.Mat4.create();
		tscon.Mat4.multiply(tmp, ry, rx);

		const model_matrix = tscon.Mat4.create();
		tscon.Mat4.multiply(model_matrix, tmp, rz);

		const light_phi = elapsed / 2.9;
		const light = [
			TorusVisuals.LIGHT_RADIUS * Math.cos(light_phi),
			TorusVisuals.LIGHT_RADIUS * Math.sin(light_phi),
			TorusVisuals.LIGHT_DEPTH
		];

		this.blinn_phong.draw(
			this.texture,
			this.normal,
			this.roughness,
			model_matrix,
			view_matrix,
			projection_matrix,
			0.33,
			light,
			0.66
		);
	}
}
