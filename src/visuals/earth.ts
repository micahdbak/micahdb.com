import { Mat4 } from "./math.ts";
import { SphereProgram } from "./programs/sphere";
import { SkyboxProgram } from "./programs/skybox";
import { loadCubeMap, loadTexture } from "@/texture.ts";
import { Visuals } from "./visuals.ts";

export class EarthVisuals extends Visuals {
	static readonly ORBIT_PERIOD = 150;
	static readonly EARTH_SPIN_PERIOD = 30;
	static readonly MOON_ORBIT_PERIOD = 25;

	private sphere: SphereProgram;
	private skybox: SkyboxProgram;

	private cubemap: WebGLTexture | null;

	private earth_texture: WebGLTexture;
	private earth_normal: WebGLTexture;
	private moon_texture: WebGLTexture;
	private moon_normal: WebGLTexture;

	async init() {
		const gl = this.canvas.gl;

		this.sphere = new SphereProgram(gl);
		this.skybox = new SkyboxProgram(gl);

		this.sphere.init();
		this.skybox.init();

		[this.cubemap, this.earth_texture, this.earth_normal, this.moon_texture, this.moon_normal] =
			await Promise.all([
				loadCubeMap(gl, [
					"/images/earth/right.png",
					"/images/earth/left.png",
					"/images/earth/top.png",
					"/images/earth/bottom.png",
					"/images/earth/front.png",
					"/images/earth/back.png"
				]),
				loadTexture(gl, "/images/earth/texture.jpg"),
				loadTexture(gl, "/images/earth/normal.jpg"),
				loadTexture(gl, "/images/earth/moon_texture.jpg"),
				loadTexture(gl, "/images/earth/moon_normal.jpg")
			]);

		if (this.cubemap !== null) {
			this.is_ready = true;
		}
	}

	draw(projection_matrix: Float32Array, elapsed: number, delta: number) {
		void delta; // unused

		const cycle =
			(2.0 * Math.PI * (elapsed % EarthVisuals.ORBIT_PERIOD)) / EarthVisuals.ORBIT_PERIOD;
		const view_x = 5.0 * Math.cos(cycle);
		const view_z = 5.0 * Math.sin(cycle);

		const view_matrix = Mat4.create();
		Mat4.lookAt(view_matrix, [view_x, 0.5, view_z], [0.0, 0.0, 0.0], [0.0, -1.0, 0.0]);

		this.skybox.draw(this.cubemap, projection_matrix, view_matrix);

		const light_position = [1.0, 0.1, 0.0];

		// earth

		const earth_model = Mat4.create();
		const upright = Mat4.rotation("x", Math.PI / 2);
		const upright2 = Mat4.rotation("z", Math.PI);
		Mat4.multiply(upright, upright2, upright);
		const earth_spin = Mat4.rotation(
			"y",
			(2.0 * Math.PI * (elapsed % EarthVisuals.EARTH_SPIN_PERIOD)) / EarthVisuals.EARTH_SPIN_PERIOD
		);
		Mat4.multiply(earth_model, earth_spin, upright);

		this.sphere.draw(
			this.earth_texture,
			this.earth_normal,
			earth_model,
			view_matrix,
			projection_matrix,
			light_position
		);

		// moon

		const moon_angle =
			(2.0 * Math.PI * (elapsed % EarthVisuals.MOON_ORBIT_PERIOD)) / EarthVisuals.MOON_ORBIT_PERIOD;
		const moon_x = 3.0 * Math.cos(moon_angle);
		const moon_z = 3.0 * Math.sin(moon_angle);

		const moon_model = Mat4.create();
		Mat4.multiply(
			moon_model,
			Mat4.translation(moon_x, 0.0, moon_z),
			Mat4.rotation("y", -moon_angle)
		);
		Mat4.multiply(moon_model, moon_model, Mat4.scale(0.27, 0.27, 0.27));

		this.sphere.draw(
			this.moon_texture,
			this.moon_normal,
			moon_model,
			view_matrix,
			projection_matrix,
			light_position
		);
	}
}
