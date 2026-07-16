import { Canvas } from "../canvas.ts";
import { Mat4 } from "./math.ts";

export abstract class Visuals {
	// width/height of framebuffer object
	private target_width: number;
	private target_height: number;

	private dbo: WebGLRenderbuffer;
	private fbo: WebGLFramebuffer;

	private projection_matrix: Float32Array;

	private elapsed: number;
	private last_time: number;

	protected canvas: Canvas;

	protected is_ready: boolean;

	// to be used with Renderer.draw
	public texture: WebGLTexture;

	constructor(canvas: Canvas) {
		this.canvas = canvas;

		this.initializeTexture();
		this.initializeDBO();
		this.initializeFBO();

		this.projection_matrix = Mat4.create();
		this.resize(canvas.rows, canvas.cols);

		this.elapsed = 0;
		this.last_time = performance.now();

		this.is_ready = false;
	}

	private initializeTexture() {
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

	private initializeDBO() {
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

	private initializeFBO() {
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

	private resize(rows: number, cols: number) {
		const width = isFinite(cols) ? Math.max(1, cols) : 1;
		const height = isFinite(rows) ? Math.max(1, rows) : 1;

		// update projection matrix
		const fovy = Math.PI / 4;
		const aspect = (0.5 * width) / height;
		const near = 0.1;
		const far = 100.0;
		Mat4.perspective(this.projection_matrix, fovy, aspect, near, far);
	}

	render() {
		const gl = this.canvas.gl;

		const now = performance.now();
		const delta = Math.min(0.1, (now - this.last_time) / 1000);
		this.last_time = now;
		this.elapsed += delta;

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
		gl.viewport(0, 0, this.target_width, this.target_height);
		gl.enable(gl.DEPTH_TEST);

		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		if (this.is_ready) {
			this.draw(this.projection_matrix, this.elapsed, delta);
		}

		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		//gl.generateMipmap(gl.TEXTURE_2D);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		gl.disable(gl.DEPTH_TEST);
	}

	abstract async init(): Promise<void>;

	abstract draw(projection_matrix: Float32Array, elapsed: number, delta: number);
}
