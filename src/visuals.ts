abstract class Visuals {
	protected gl: WebGL2RenderingContext;
	protected program: WebGLProgram;

	protected targetWidth: number;
	protected targetHeight: number;

	// must render to this
	public texture: WebGLTexture;

	constructor(gl: WebGL2RenderingContext) {
		this.gl = gl;

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
	abstract setPalette(palette: Float32Array): void;

	resize(width: number, height: number) {
		this.gl.useProgram(this.program);

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
	}

	abstract draw(): void;
}

export { Visuals };
