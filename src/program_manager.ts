import { Mat4 } from "./math.ts";
import { Program } from "./program.ts";
import { CubeProgram } from "./programs/cube";
import { EarthProgram } from "./programs/earth";
import { SkyboxProgram } from "./programs/skybox";

class ProgramManager {
	private gl: WebGL2RenderingContext;

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

	// to be used by renderer.ts; each pixel is a glyph
	public texture: WebGLTexture;

	constructor(gl: WebGL2RenderingContext) {
		this.gl = gl;

		this.initializeTexture();
		this.initializeDBO();
		this.initializeFBO();

		this.projection_matrix = Mat4.create();

		this.cube = new CubeProgram(gl);
		this.earth = new EarthProgram(gl);
		this.skybox = new SkyboxProgram(gl);

		this.programs = [this.cube, this.earth, this.skybox];
		this.which = "";
	}

	init() {
		for (const program of this.programs) {
			program.init();
		}
	}

	initializeTexture() {
		this.target_width = 32;
		this.target_height = 32;

		this.texture = this.gl.createTexture();
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
		this.gl.texImage2D(
			this.gl.TEXTURE_2D,
			0,
			this.gl.RGBA,
			32,
			32,
			0,
			this.gl.RGBA,
			this.gl.UNSIGNED_BYTE,
			null
		);

		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
	}

	initializeDBO() {
		this.dbo = this.gl.createRenderbuffer();
		if (!this.dbo) {
			throw new Error("When creating depth render buffer");
		}

		this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.dbo);
		this.gl.renderbufferStorage(
			this.gl.RENDERBUFFER,
			this.gl.DEPTH_COMPONENT16,
			this.target_width,
			this.target_height
		);
	}

	initializeFBO() {
		this.fbo = this.gl.createFramebuffer();
		if (!this.fbo) {
			throw new Error("When creating frame buffer");
		}

		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
		this.gl.framebufferTexture2D(
			this.gl.FRAMEBUFFER,
			this.gl.COLOR_ATTACHMENT0,
			this.gl.TEXTURE_2D,
			this.texture,
			0
		);
		this.gl.framebufferRenderbuffer(
			this.gl.FRAMEBUFFER,
			this.gl.DEPTH_ATTACHMENT,
			this.gl.RENDERBUFFER,
			this.dbo
		);
	}

	resize(width: number, height: number) {
		width = isFinite(width) ? Math.max(1, width) : 1;
		height = isFinite(height) ? Math.max(1, height) : 1;

		// update texture size
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
		this.gl.texImage2D(
			this.gl.TEXTURE_2D,
			0,
			this.gl.RGBA,
			width,
			height,
			0,
			this.gl.RGBA,
			this.gl.UNSIGNED_BYTE,
			null
		);

		// update depth buffer size to match texture
		this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.dbo);
		this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, width, height);

		// update projection matrix
		const fovy = Math.PI / 4;
		const aspect = (0.5 * width) / height;
		const near = 0.1;
		const far = 100.0;
		Mat4.perspective(this.projection_matrix, fovy, aspect, near, far);

		this.target_width = width;
		this.target_height = height;
	}

	draw() {
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
		this.gl.enable(this.gl.DEPTH_TEST);

		this.gl.viewport(0, 0, this.target_width, this.target_height);
		this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

		switch (this.which) {
			case "cube":
				this.cube.draw(this.projection_matrix);

				break;

			case "earth":
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

		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
	}
}

export { ProgramManager };
