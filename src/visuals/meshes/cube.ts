import { TriangleMesh } from "../mesh.ts";

function repeat(arr: number[], n: number): number[] {
	const ret = [];

	for (let i = 0; i < n; i++) {
		ret.push(...arr);
	}

	return ret;
}

export class CubeMesh extends TriangleMesh {
	static readonly NUM_VERTICES = 36;

	constructor() {
		super();

		// all are ordered by the following faces when looking
		// down negative the z axis with positive y upwards:
		// - front
		// - back
		// - right
		// - left
		// - top
		// - bottom

		// vertex coords
		const blf = [-1, -1, 1]; // bottom-left-front
		const blb = [-1, -1, -1]; // bottom-left-back
		const brf = [1, -1, 1]; // bottom-right-front
		const brb = [1, -1, -1]; // bottom-right-back
		const tlf = [-1, 1, 1]; // top-left-front
		const tlb = [-1, 1, -1]; // top-left-back
		const trf = [1, 1, 1]; // top-right-front
		const trb = [1, 1, -1]; // top-right-back

		// prettier-ignore
		this.positions = [
			...tlf, ...blf, ...brf, ...tlf, ...brf, ...trf,
			...trb, ...brb, ...blb, ...trb, ...blb, ...tlb,
			...trf, ...brf, ...brb, ...trf, ...brb, ...trb,
			...tlb, ...blb, ...blf, ...tlb, ...blf, ...tlf,
			...tlb, ...tlf, ...trf, ...tlb, ...trf, ...trb,
			...blf, ...blb, ...brb, ...blf, ...brb, ...brf,
		];

		this.normals = [
			...repeat([0, 0, 1], 6),
			...repeat([0, 0, -1], 6),
			...repeat([1, 0, 0], 6),
			...repeat([-1, 0, 0], 6),
			...repeat([0, 1, 0], 6),
			...repeat([0, -1, 0], 6)
		];

		this.tangents = [
			...repeat([1, 0, 0], 6),
			...repeat([-1, 0, 0], 6),
			...repeat([0, 0, -1], 6),
			...repeat([0, 0, 1], 6),
			...repeat([1, 0, 0], 6),
			...repeat([1, 0, 0], 6)
		];

		// prettier-ignore
		this.uvCoords = [
			0, 1, 0, 2/3, 1/2, 2/3, 0, 1, 1/2, 2/3, 1/2, 1,
			1/2, 1/3, 1/2, 0, 1, 0, 1/2, 1/3, 1, 0, 1, 1/3,
			0, 2/3, 0, 1/3, 1/2, 1/3, 0, 2/3, 1/2, 1/3, 1/2, 2/3,
			1/2, 2/3, 1/2, 1/3, 1, 1/3, 1/2, 2/3, 1, 1/3, 1, 2/3,
			0, 1/3, 0, 0, 1/2, 0, 0, 1/3, 1/2, 0, 1/2, 1/3,
			1/2, 1, 1/2, 2/3, 1, 2/3, 1/2, 1, 1, 2/3, 1, 1,
		];
	}
}
