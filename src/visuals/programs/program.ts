export abstract class Program {
	protected gl: WebGL2RenderingContext;
	protected gl_program: WebGLProgram;

	constructor(gl: WebGL2RenderingContext) {
		this.gl = gl;
		this.gl_program = null;
	}

	abstract init(): void;

	abstract draw(): void;
}
