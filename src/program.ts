export abstract class Program {
	protected gl: WebGL2RenderingContext;
	protected glProgram: WebGLProgram;

	constructor(gl: WebGL2RenderingContext) {
		this.gl = gl;
	}

	loadProgram(vertex_shader: string, fragment_shader: string) {
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

		const prog = this.gl.createProgram();
		if (!prog) {
			throw new Error("When creating GPU program");
		}

		this.gl.attachShader(prog, vertShader);
		this.gl.attachShader(prog, fragShader);
		this.gl.linkProgram(prog);
		if (!this.gl.getProgramParameter(prog, this.gl.LINK_STATUS)) {
			throw new Error(
				"When linking shader program: " + this.gl.getProgramInfoLog(prog)
			);
		}

		this.glProgram = prog;
		this.gl.useProgram(this.glProgram);
	}

	abstract async init(): Promise;
	abstract draw(): void;

	// optional to implement:
	// resize(width: number, height:number)
	resize(): void {
		// pass
	}
}
