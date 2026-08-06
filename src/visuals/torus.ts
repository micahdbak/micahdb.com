import { Canvas } from "@/canvas.ts";
import { loadTexture } from "@/texture.ts";
import { Mat4 } from "@/math.ts";

import { Visuals } from "./visuals.ts";
import { torusMesh } from "./meshes/torus.ts";
import { BlinnPhongIndicesProgram } from "./programs/blinn_phong_indices.ts";

export class TorusVisuals extends Visuals {
	static readonly YAW_HALF_RANGE = Math.PI / 3;
	static readonly PITCH_HALF_RANGE = Math.PI / 3;
	static readonly TRACKING_K = 4;

	private blinn_phong: BlinnPhongIndicesProgram;

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

		this.blinn_phong = new BlinnPhongIndicesProgram(gl);
		this.blinn_phong.init(torusMesh(32, 24, 4, 1));

		[this.texture, this.normal, this.roughness] = await Promise.all([
			loadTexture(gl, "/images/torus/texture.jpg"),
			loadTexture(gl, "/images/torus/normal.jpg"),
			loadTexture(gl, "/images/torus/roughness.jpg")
		]);

		this.is_ready = true;
	}

	draw(projection_matrix: Float32Array, elapsed: number, delta: number) {
		void elapsed; // unused
		void delta; // unused

		// camera placed in front of the origin, looking at the torus's front face
		const view_matrix = Mat4.create();
		Mat4.lookAt(view_matrix, [0.0, 0.0, 16.0], [0.0, 0.0, 0.0], [0.0, -1.0, 0.0]);

		// rotate the torus so its front face tracks the cursor
		const ry = Mat4.rotation("y", elapsed / 1.7);
		const rx = Mat4.rotation("x", elapsed / 1.9);
		const rz = Mat4.rotation("z", elapsed / 2.3);

		const tmp = Mat4.create();
		Mat4.multiply(tmp, ry, rx);

		const model_matrix = Mat4.create();
		Mat4.multiply(model_matrix, tmp, rz);

		const light_phi = elapsed / 2.9;
		const light_x = Math.cos(light_phi);
		const light_y = Math.sin(light_phi);
		const light = [light_x, light_y, 0.5];

		this.blinn_phong.draw(
			this.texture,
			this.normal,
			this.roughness,
			model_matrix,
			view_matrix,
			projection_matrix,
			light
		);
	}
}
