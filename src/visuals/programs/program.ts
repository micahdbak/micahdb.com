export abstract class Program {
	protected readonly gl: WebGL2RenderingContext;
	protected readonly gl_program: WebGLProgram;

	constructor(gl: WebGL2RenderingContext, gl_program: WebGLProgram) {
		this.gl = gl;
		this.gl_program = gl_program;
	}

	abstract draw(...args: unknown[]): void;
}
