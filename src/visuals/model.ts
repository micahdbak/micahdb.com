import * as tscon from "@micahdb/tscon";

import { Visuals } from "./visuals.ts";
import { loadGLB } from "./meshes/gltf.ts";
import { BlinnPhongIndicesProgram } from "./programs/blinn_phong_indices.ts";

/*
 * Renders a glTF (.glb) model, uniformly scaled and recentered so its center
 * sits at the origin. The camera circles the model at a fixed distance,
 * elevated 30 degrees above the horizontal plane and pointed at the center
 * of the object.
 */
export class ModelVisuals extends Visuals {
	private readonly url: string;
	private readonly texture_path: string;
	private readonly normal_path: string;
	private readonly roughness_path: string;

	private blinn_phong!: BlinnPhongIndicesProgram;

	private texture!: WebGLTexture;
	private normal!: WebGLTexture;
	private roughness!: WebGLTexture;

	// normalization factors derived from the model's bounding sphere
	private center: [number, number, number] = [0, 0, 0];
	private scale = 1;
	private height = 1;

	constructor(
		canvas: tscon.Canvas,
		url: string,
		texture_path: string,
		normal_path: string,
		roughness_path: string
	) {
		super(canvas);
		this.url = url;
		this.texture_path = texture_path;
		this.normal_path = normal_path;
		this.roughness_path = roughness_path;
	}

	async init() {
		const gl = this.canvas.gl;

		const model = await loadGLB(this.url);

		this.blinn_phong = new BlinnPhongIndicesProgram(gl, model.mesh);

		// recenter the model and scale it to a radius of 1.5, so it fills about
		// half of the frame at the default camera distance of 8
		this.center = model.center;
		this.scale = 1.5 / model.radius;
		this.height = model.size[1] * this.scale;

		[this.texture, this.normal, this.roughness] = await Promise.all([
			tscon.loadTexture(gl, this.texture_path),
			tscon.loadTexture(gl, this.normal_path),
			tscon.loadTexture(gl, this.roughness_path)
		]);

		// tscon.loadTexture gives LINEAR filtering with mipmaps; pixel art wants hard
		// texel edges, so switch to nearest-neighbour sampling instead
		for (const tex of [this.texture, this.normal, this.roughness]) {
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		}

		this.is_ready = true;
	}

	draw(projection_matrix: Float32Array, elapsed: number, delta: number) {
		void delta; // unused

		// camera circles the model: 15 degrees above the horizontal plane,
		// looking down at the model's center (the origin)
		const distance = 4.5;
		const elevation = Math.PI / 12.0;
		const phi = elapsed / 3.0;
		const eye = [
			distance * Math.cos(phi) * Math.cos(elevation),
			distance * Math.sin(elevation),
			distance * Math.sin(phi) * Math.cos(elevation)
		];
		const view_matrix = tscon.Mat4.create();
		tscon.Mat4.lookAt(
			view_matrix,
			new Float32Array(eye),
			new Float32Array([0.0, 0.0, 0.0]),
			new Float32Array([0.0, -1.0, 0.0])
		);

		// model = S * T(-center): recentered, uniformly scaled, and static
		// (the camera provides the motion)
		const translate = tscon.Mat4.translation(-this.center[0], -this.center[1], -this.center[2]);

		const scale_translate = tscon.Mat4.create();
		tscon.Mat4.multiply(
			scale_translate,
			tscon.Mat4.scale(this.scale, this.scale, this.scale),
			translate
		);

		const model_matrix = scale_translate;

		const light = [0.0, 0.5 * this.height, 2.5];

		this.blinn_phong.draw(
			this.texture,
			this.normal,
			this.roughness,
			model_matrix,
			view_matrix,
			projection_matrix,
			0.75,
			light,
			1.5
		);
	}
}
