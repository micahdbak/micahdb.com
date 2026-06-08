import { Program } from "./program.ts";
import { CubeProgram } from "./programs/cube.ts";
import { SphereProgram } from "./programs/sphere.ts";

class ProgramManager {
	private cube: CubeProgram;
	private sphere: SphereProgram;

	constructor(gl: WebGL2RenderingContext) {
		this.cube = new CubeProgram(gl);
		this.sphere = new SphereProgram(gl);
	}

	get(name: str): Program {
		switch (name) {
			case "cube":
				return this.cube;
				break;

			case "sphere":
				return this.sphere;
				break;

			default:
				throw new Error(`No program by the name of "${name}"`);
				break;
		}
	}
}

export { ProgramManager };
