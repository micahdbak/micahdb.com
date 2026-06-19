export function compileProgram(
	gl: WebGL2RenderingContext,
	vertex_shader: string,
	fragment_shader: string
): WebGLProgram {
	const vertShader = gl.createShader(gl.VERTEX_SHADER);
	if (!vertShader) {
		throw new Error("When creating vertex shader");
	}

	gl.shaderSource(vertShader, vertex_shader);
	gl.compileShader(vertShader);
	if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
		throw new Error(
			"When compiling vertex shader: " + gl.getShaderInfoLog(vertShader)
		);
	}

	const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
	if (!fragShader) {
		throw new Error("When creating fragment shader");
	}

	gl.shaderSource(fragShader, fragment_shader);
	gl.compileShader(fragShader);
	if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
		throw new Error(
			"When compiling fragment shader: " + gl.getShaderInfoLog(fragShader)
		);
	}

	const prog = gl.createProgram();
	if (!prog) {
		throw new Error("When creating GPU program");
	}

	gl.attachShader(prog, vertShader);
	gl.attachShader(prog, fragShader);
	gl.linkProgram(prog);
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
		throw new Error(
			"When linking shader program: " + gl.getProgramInfoLog(prog)
		);
	}

	return prog;
}

export function getAttribLocations(
	gl: WebGL2RenderingContext,
	program: WebGLProgram,
	mapping: Record<string, string>
): Record<string, number> {
	const attributes: Record<string, number> = {};

	for (const key of Object.keys(mapping)) {
		const name_in_program = mapping[key];
		const location = gl.getAttribLocation(program, name_in_program);

		if (location < 0) {
			throw new Error(`When getting attribute location for ${name_in_program}`);
		}

		attributes[key] = location;
	}

	return attributes;
}

export function getUniformLocations(
	gl: WebGL2RenderingContext,
	program: WebGLProgram,
	mapping: Record<string, string>
): Record<string, WebGLUniformLocation> {
	const uniforms: Record<string, number> = {};

	for (const key of Object.keys(mapping)) {
		const name_in_program = mapping[key];
		const location = gl.getUniformLocation(program, name_in_program);

		if (!location) {
			throw new Error(`When getting uniform location for ${name_in_program}`);
		}

		uniforms[key] = location;
	}

	return uniforms;
}

export abstract class Program {
	protected gl: WebGL2RenderingContext;
	protected glProgram: WebGLProgram;

	constructor(gl: WebGL2RenderingContext) {
		this.gl = gl;
	}

	abstract init(): void;
	abstract draw(): void;

	// optional to implement:
	// resize(width: number, height:number)
	resize(): void {
		// pass
	}
}
