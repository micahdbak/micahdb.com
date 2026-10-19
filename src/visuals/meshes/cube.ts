import { TriangleMesh } from "./mesh.ts";

export function cubeMesh(): TriangleMesh {
	const cube = new TriangleMesh();

	// all are ordered by the following faces when looking
	// down negative the z axis with positive y upwards:
	// - front
	// - back
	// - right
	// - left
	// - top
	// - bottom

	// vertex coords

		// front
		cube.addVertex([-1, 1, 1], [0, 0, 1], [1, 0, 0], [0, 1]);
		cube.addVertex([-1, -1, 1], [0, 0, 1], [1, 0, 0], [0, 2 / 3]);
		cube.addVertex([1, -1, 1], [0, 0, 1], [1, 0, 0], [1 / 2, 2 / 3]);
		cube.addVertex([-1, 1, 1], [0, 0, 1], [1, 0, 0], [0, 1]);
		cube.addVertex([1, -1, 1], [0, 0, 1], [1, 0, 0], [1 / 2, 2 / 3]);
		cube.addVertex([1, 1, 1], [0, 0, 1], [1, 0, 0], [1 / 2, 1]);

		// back
		cube.addVertex([1, 1, -1], [0, 0, -1], [-1, 0, 0], [1 / 2, 1 / 3]);
		cube.addVertex([1, -1, -1], [0, 0, -1], [-1, 0, 0], [1 / 2, 0]);
		cube.addVertex([-1, -1, -1], [0, 0, -1], [-1, 0, 0], [1, 0]);
		cube.addVertex([1, 1, -1], [0, 0, -1], [-1, 0, 0], [1 / 2, 1 / 3]);
		cube.addVertex([-1, -1, -1], [0, 0, -1], [-1, 0, 0], [1, 0]);
		cube.addVertex([-1, 1, -1], [0, 0, -1], [-1, 0, 0], [1, 1 / 3]);

		// right
		cube.addVertex([1, 1, 1], [1, 0, 0], [0, 0, -1], [0, 2 / 3]);
		cube.addVertex([1, -1, 1], [1, 0, 0], [0, 0, -1], [0, 1 / 3]);
		cube.addVertex([1, -1, -1], [1, 0, 0], [0, 0, -1], [1 / 2, 1 / 3]);
		cube.addVertex([1, 1, 1], [1, 0, 0], [0, 0, -1], [0, 2 / 3]);
		cube.addVertex([1, -1, -1], [1, 0, 0], [0, 0, -1], [1 / 2, 1 / 3]);
		cube.addVertex([1, 1, -1], [1, 0, 0], [0, 0, -1], [1 / 2, 2 / 3]);

		// left
		cube.addVertex([-1, 1, -1], [-1, 0, 0], [0, 0, 1], [1 / 2, 2 / 3]);
		cube.addVertex([-1, -1, -1], [-1, 0, 0], [0, 0, 1], [1 / 2, 1 / 3]);
		cube.addVertex([-1, -1, 1], [-1, 0, 0], [0, 0, 1], [1, 1 / 3]);
		cube.addVertex([-1, 1, -1], [-1, 0, 0], [0, 0, 1], [1 / 2, 2 / 3]);
		cube.addVertex([-1, -1, 1], [-1, 0, 0], [0, 0, 1], [1, 1 / 3]);
		cube.addVertex([-1, 1, 1], [-1, 0, 0], [0, 0, 1], [1, 2 / 3]);

		// top
		cube.addVertex([-1, 1, -1], [0, 1, 0], [1, 0, 0], [0, 1 / 3]);
		cube.addVertex([-1, 1, 1], [0, 1, 0], [1, 0, 0], [0, 0]);
		cube.addVertex([1, 1, 1], [0, 1, 0], [1, 0, 0], [1 / 2, 0]);
		cube.addVertex([-1, 1, -1], [0, 1, 0], [1, 0, 0], [0, 1 / 3]);
		cube.addVertex([1, 1, 1], [0, 1, 0], [1, 0, 0], [1 / 2, 0]);
		cube.addVertex([1, 1, -1], [0, 1, 0], [1, 0, 0], [1 / 2, 1 / 3]);

		// bottom
		cube.addVertex([-1, -1, 1], [0, -1, 0], [1, 0, 0], [1 / 2, 1]);
		cube.addVertex([-1, -1, -1], [0, -1, 0], [1, 0, 0], [1 / 2, 2 / 3]);
		cube.addVertex([1, -1, -1], [0, -1, 0], [1, 0, 0], [1, 2 / 3]);
		cube.addVertex([-1, -1, 1], [0, -1, 0], [1, 0, 0], [1 / 2, 1]);
		cube.addVertex([1, -1, -1], [0, -1, 0], [1, 0, 0], [1, 2 / 3]);
		cube.addVertex([1, -1, 1], [0, -1, 0], [1, 0, 0], [1, 1]);

	return cube;
}
