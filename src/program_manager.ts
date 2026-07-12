import { Canvas } from "./canvas.ts";
import { Mat4 } from "./math.ts";
import { Program } from "./program.ts";
import { CubeProgram } from "./programs/cube";
import { EarthProgram } from "./programs/earth";
import { SkyboxProgram } from "./programs/skybox";

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

		this.cube = new CubeProgram(gl);
		this.earth = new EarthProgram(gl);
		this.skybox = new SkyboxProgram(gl);

		this.programs = [this.cube, this.earth, this.skybox];
		this.which = "";

		for (const program of this.programs) {
			program.init();
			void program.load();
		}

		this.resize(canvas.rows, canvas.cols);
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

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
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

		// update texture size
		/*
		this.target_width = width;
		this.target_height = height;

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

		// update depth buffer size to match texture
		gl.bindRenderbuffer(gl.RENDERBUFFER, this.dbo);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.target_width, this.target_height);
		*/

		// update projection matrix
		const fovy = Math.PI / 4;
		const aspect = (0.5 * width) / height;
		const near = 0.1;
		const far = 100.0;
		Mat4.perspective(this.projection_matrix, fovy, aspect, near, far);
	}

	draw() {
		const gl = this.canvas.gl;

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

			case "earth":
				if (!this.skybox.is_ready || !this.earth.is_ready) {
					break;
				}

				const view_x = 5.0 * Math.cos((2.0 * Math.PI * (Date.now() % 77777)) / 77777);
				const view_z = 5.0 * Math.sin((2.0 * Math.PI * (Date.now() % 77777)) / 77777);

				const view_matrix = Mat4.create();
				Mat4.lookAt(view_matrix, [view_x, 0.5, view_z], [0.0, 0.0, 0.0], [0.0, -1.0, 0.0]);

				this.skybox.draw(this.projection_matrix, view_matrix);
				this.earth.draw(this.projection_matrix, view_matrix);

				break;

			default:
				break;
		}

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		gl.disable(gl.DEPTH_TEST);
	}
}

export { ProgramManager };
