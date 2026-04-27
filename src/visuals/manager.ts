import { Visuals } from "../visuals.ts";

import { CubeVisuals } from "./cube.ts";

class VisualsManager {
	cube: CubeVisuals;

	constructor(gl: WebGL2RenderingContext) {
		this.cube = new CubeVisuals(gl);
	}

	get(name: str): Visuals {
		switch (name) {
			case "cube":
				return this.cube;
				break;
			default:
				throw new Error(`No visuals by the name of "${name}"`);
				break;
		}
	}
}

export { VisualsManager };
