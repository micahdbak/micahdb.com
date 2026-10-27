import { TriangleIndicesMesh } from "./mesh.ts";

export type Model = {
	mesh: TriangleIndicesMesh;
	// center of the mesh's bounding box (baked-transform space)
	center: [number, number, number];
	// radius of the bounding sphere around `center`
	radius: number;
	// full extent of the bounding box: (max - min) per axis
	size: [number, number, number];
};
