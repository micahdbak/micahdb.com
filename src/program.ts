export abstract class Program {
	protected gl: WebGL2RenderingContext;
	protected glProgram: WebGLProgram;

	protected targetWidth: number;
	protected targetHeight: number;

	protected dbo: WebGLRenderbuffer;
	protected fbo: WebGLFramebuffer;

	// must render to this
	public texture: WebGLTexture;

	constructor(gl: WebGL2RenderingContext) {
		this.gl = gl;

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

	abstract async init(): Promise;
	abstract resized(width: number, height: number): void;

	initializeProgram(vertex_shader: string, fragment_shader: string) {
		const vertShader = this.gl.createShader(this.gl.VERTEX_SHADER);
		if (!vertShader) {
			throw new Error("When creating vertex shader");
		}

		this.gl.shaderSource(vertShader, vertex_shader);
		this.gl.compileShader(vertShader);
		if (!this.gl.getShaderParameter(vertShader, this.gl.COMPILE_STATUS)) {
			throw new Error(
				"When compiling vertex shader: " + this.gl.getShaderInfoLog(vertShader)
			);
		}

		const fragShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
		if (!fragShader) {
			throw new Error("When creating fragment shader");
		}

		this.gl.shaderSource(fragShader, fragment_shader);
		this.gl.compileShader(fragShader);
		if (!this.gl.getShaderParameter(fragShader, this.gl.COMPILE_STATUS)) {
			throw new Error(
				"When compiling fragment shader: " +
					this.gl.getShaderInfoLog(fragShader)
			);
		}

		const glProgram = this.gl.createProgram();
		if (!glProgram) {
			throw new Error("When creating GPU program");
		}

		this.glProgram = glProgram;

		this.gl.attachShader(this.glProgram, vertShader);
		this.gl.attachShader(this.glProgram, fragShader);
		this.gl.linkProgram(this.glProgram);
		if (!this.gl.getProgramParameter(this.glProgram, this.gl.LINK_STATUS)) {
			throw new Error(
				"When linking shader program: " +
					this.gl.getProgramInfoLog(this.glProgram)
			);
		}

		this.gl.useProgram(this.glProgram);
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
		this.gl.useProgram(this.glProgram);

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

		this.targetWidth = width;
		this.targetHeight = height;

		this.resized(width, height);
	}

	abstract draw(): void;
}
