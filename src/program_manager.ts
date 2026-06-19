import { Mat4 } from "./math.ts";
import { Program } from "./program.ts";
import { CubeProgram } from "./programs/cube";
import { EarthProgram } from "./programs/earth";
import { SkyboxProgram } from "./programs/skybox";

class ProgramManager {
	private gl: WebGL2RenderingContext;

	// width/height of framebuffer object
	private targetWidth: number;
	private targetHeight: number;

	private dbo: WebGLRenderbuffer;
	private fbo: WebGLFramebuffer;

	private projectionMatrix: Float32Array;

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

		this.projectionMatrix = Mat4.create();

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
		this.targetWidth = 32;
		this.targetHeight = 32;

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

		this.gl.texParameteri(
			this.gl.TEXTURE_2D,
			this.gl.TEXTURE_MIN_FILTER,
			this.gl.NEAREST
		);
		this.gl.texParameteri(
			this.gl.TEXTURE_2D,
			this.gl.TEXTURE_MAG_FILTER,
			this.gl.NEAREST
		);

		this.gl.texParameteri(
			this.gl.TEXTURE_2D,
			this.gl.TEXTURE_WRAP_S,
			this.gl.CLAMP_TO_EDGE
		);
		this.gl.texParameteri(
			this.gl.TEXTURE_2D,
			this.gl.TEXTURE_WRAP_T,
			this.gl.CLAMP_TO_EDGE
		);
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
			this.targetWidth,
			this.targetHeight
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
		this.gl.renderbufferStorage(
			this.gl.RENDERBUFFER,
			this.gl.DEPTH_COMPONENT16,
			width,
			height
		);

		// update projection matrix
		const fovy = Math.PI / 4;
		const aspect = (0.5 * width) / height;
		const near = 0.1;
		const far = 100.0;
		Mat4.perspective(this.projectionMatrix, fovy, aspect, near, far);

		// resize programs
		for (const program of this.programs) {
			program.resize(width, height);
		}

		this.targetWidth = width;
		this.targetHeight = height;
	}

	draw() {
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
		this.gl.enable(this.gl.DEPTH_TEST);

		this.gl.viewport(0, 0, this.targetWidth, this.targetHeight);
		this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

		switch (this.which) {
			case "cube":
				this.cube.draw(this.projectionMatrix);

				break;

			case "earth":
				const viewX =
					5.0 * Math.cos((2.0 * Math.PI * (Date.now() % 77777)) / 77777);
				const viewZ =
					5.0 * Math.sin((2.0 * Math.PI * (Date.now() % 77777)) / 77777);

				const viewMatrix = Mat4.create();
				Mat4.lookAt(
					viewMatrix,
					[viewX, 0.5, viewZ],
					[0.0, 0.0, 0.0],
					[0.0, -1.0, 0.0]
				);

				this.skybox.draw(this.projectionMatrix, viewMatrix);
				this.earth.draw(this.projectionMatrix, viewMatrix);

				break;

			default:
				break;
		}

		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
	}
}

export { ProgramManager };
