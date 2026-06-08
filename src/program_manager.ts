import { Program } from "./program.ts";
import { CubeProgram } from "./programs/cube.ts";
import { GlobeProgram } from "./programs/globe.ts";

class ProgramManager {
	private cube: CubeProgram;
	private globe: GlobeProgram;

	constructor(gl: WebGL2RenderingContext) {
		this.cube = new CubeProgram(gl);
		this.globe = new GlobeProgram(gl);
	}

	get(name: str): Program {
		switch (name) {
			case "cube":
				return this.cube;
				break;

			case "globe":
				return this.globe;
				break;

			default:
				throw new Error(`No program by the name of "${name}"`);
				break;
		}
	}
}

export { ProgramManager };
