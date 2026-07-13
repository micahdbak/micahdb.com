import { Canvas } from "./canvas.ts";
import { Mat4 } from "./math.ts";
import { Program } from "./program.ts";
import { CubeProgram } from "./programs/cube";
import { EarthProgram } from "./programs/earth";
import { SkyboxProgram } from "./programs/skybox";
import { loadCubeMap } from "./textures.ts";

class ProgramManager {
	private canvas: Canvas;

	// width/height of framebuffer object
	private target_width: number;
	private target_height: number;

	private dbo: WebGLRenderbuffer;
	private fbo: WebGLFramebuffer;

	private projection_matrix: Float32Array;

	private cube: CubeProgram;
	private earth: EarthProgram;
	private skybox: SkyboxProgram;
	private programs: Program[];

	public earth_cubemap: WebGLTexture | null;
	public nebulae_cubemap: WebGLTexture | null;

	static readonly ORBIT_PERIOD = 150;

	private elapsed: number;
	private last_time: number;

	private nebulae_yaw: number;
	private nebulae_pitch: number;
	private last_which: string;

	public which: string;

	// to be used with Renderer.draw
	public texture: WebGLTexture;

	constructor(canvas: Canvas) {
		this.canvas = canvas;
		const gl = canvas.gl;

		this.initializeTexture();
		this.initializeDBO();
		this.initializeFBO();

		this.projection_matrix = Mat4.create();

		this.earth_cubemap = null;
		this.nebulae_cubemap = null;

		this.elapsed = 0;
		this.last_time = performance.now();

		this.nebulae_yaw = 0;
		this.nebulae_pitch = 0;
		this.last_which = "";

		this.cube = new CubeProgram(gl);
		this.earth = new EarthProgram(gl);
		this.skybox = new SkyboxProgram(gl);

		this.programs = [this.cube, this.earth, this.skybox];

		for (const program of this.programs) {
			program.init();
			void program.load();
		}

		void this.load();

		this.which = "";

		this.resize(canvas.rows, canvas.cols);
	}

	private async load() {
		const gl = this.canvas.gl;

		this.earth_cubemap = await loadCubeMap(gl, [
			"/images/earth/right.png",
			"/images/earth/left.png",
			"/images/earth/top.png",
			"/images/earth/bottom.png",
			"/images/earth/front.png",
			"/images/earth/back.png"
		]);

		this.nebulae_cubemap = await loadCubeMap(gl, [
			"/images/nebulae/right.png",
			"/images/nebulae/left.png",
			"/images/nebulae/top.png",
			"/images/nebulae/bottom.png",
			"/images/nebulae/front.png",
			"/images/nebulae/back.png"
		]);
	}

	initializeTexture() {
		this.target_width = 1024;
		this.target_height = 1024;

		const gl = this.canvas.gl;

		this.texture = gl.createTexture();

		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			this.target_width,
			this.target_height,
			0,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			null
		);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	}

	initializeDBO() {
		const gl = this.canvas.gl;

		this.dbo = gl.createRenderbuffer();
		if (!this.dbo) {
			throw new Error("When creating depth render buffer");
		}

		gl.bindRenderbuffer(gl.RENDERBUFFER, this.dbo);
		gl.renderbufferStorage(
			gl.RENDERBUFFER,
			gl.DEPTH_COMPONENT16,
			this.target_width,
			this.target_height
		);

		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	}

	initializeFBO() {
		const gl = this.canvas.gl;

		this.fbo = gl.createFramebuffer();
		if (!this.fbo) {
			throw new Error("When creating frame buffer");
		}

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.dbo);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	resize(rows: number, cols: number) {
		const width = isFinite(cols) ? Math.max(1, cols) : 1;
		const height = isFinite(rows) ? Math.max(1, rows) : 1;

		// update projection matrix
		const fovy = Math.PI / 4;
		const aspect = (0.5 * width) / height;
		const near = 0.1;
		const far = 100.0;
		Mat4.perspective(this.projection_matrix, fovy, aspect, near, far);
	}

	draw() {
		const gl = this.canvas.gl;

		const now = performance.now();
		const dt = Math.min(0.1, (now - this.last_time) / 1000);
		this.last_time = now;
		this.elapsed += dt;

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
		gl.viewport(0, 0, this.target_width, this.target_height);
		gl.enable(gl.DEPTH_TEST);

		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		switch (this.which) {
			case "cube":
				if (!this.cube.is_ready) {
					break;
				}

				this.cube.draw(this.projection_matrix);

				break;

			case "earth": {
				if (!this.skybox.is_ready || !this.earth.is_ready || this.earth_cubemap === null) {
					break;
				}

				const cycle =
					(2.0 * Math.PI * (this.elapsed % ProgramManager.ORBIT_PERIOD)) /
					ProgramManager.ORBIT_PERIOD;
				const view_x = 5.0 * Math.cos(cycle);
				const view_z = 5.0 * Math.sin(cycle);

				const view_matrix = Mat4.create();
				Mat4.lookAt(view_matrix, [view_x, 0.5, view_z], [0.0, 0.0, 0.0], [0.0, -1.0, 0.0]);

				this.skybox.draw(this.earth_cubemap, this.projection_matrix, view_matrix);
				this.earth.draw(this.projection_matrix, view_matrix);

				break;
			}

			case "nebulae": {
				if (!this.skybox.is_ready || this.nebulae_cubemap === null) {
					break;
				}

				const base_yaw_half = Math.PI / 36;
				const base_pitch_half = Math.PI / 18;
				const range_delta = base_pitch_half - base_yaw_half;

				// 1:2 cells -> 2 cols == 1 row physically; >1 wide, <1 tall.
				const aspect =
					(this.canvas.cols * Canvas.CELL_WIDTH) / (this.canvas.rows * Canvas.CELL_HEIGHT);
				const tallness = 1 / (1 + aspect);

				const yaw_half_range = base_yaw_half + range_delta * tallness;
				const pitch_half_range = base_pitch_half - range_delta * tallness;

				const target_yaw =
					((this.canvas.mouse_col ?? 0) / this.canvas.cols - 0.5) * 2.0 * yaw_half_range;
				const target_pitch =
					((this.canvas.mouse_row ?? 0) / this.canvas.rows - 0.5) * 2.0 * pitch_half_range;

				// snap to target on entry to the program
				if (this.last_which !== "nebulae") {
					this.nebulae_yaw = target_yaw;
					this.nebulae_pitch = target_pitch;
				} else {
					const k = 4;
					const alpha = 1 - Math.exp(-k * dt);

					this.nebulae_yaw += (target_yaw - this.nebulae_yaw) * alpha;
					this.nebulae_pitch += (target_pitch - this.nebulae_pitch) * alpha;
				}

				const cycle =
					(2.0 * Math.PI * (this.elapsed % ProgramManager.ORBIT_PERIOD)) /
					ProgramManager.ORBIT_PERIOD;
				const view_x = 5.0 * Math.cos(cycle);
				const view_z = 5.0 * Math.sin(cycle);

				const view_matrix = Mat4.create();
				Mat4.lookAt(view_matrix, [view_x, 0.5, view_z], [0.0, 0.0, 0.0], [0.0, -1.0, 0.0]);

				const yaw_matrix = Mat4.rotation("y", this.nebulae_yaw);
				const pitch_matrix = Mat4.rotation("x", -this.nebulae_pitch);

				const offset_matrix = Mat4.create();
				Mat4.multiply(offset_matrix, yaw_matrix, pitch_matrix);

				const final_view_matrix = Mat4.create();
				Mat4.multiply(final_view_matrix, offset_matrix, view_matrix);

				this.skybox.draw(this.nebulae_cubemap, this.projection_matrix, final_view_matrix);

				break;
			}

			default:
				break;
		}

		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.generateMipmap(gl.TEXTURE_2D);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		gl.disable(gl.DEPTH_TEST);

		this.last_which = this.which;
	}
}

export { ProgramManager };
