import { TriangleMesh } from "../mesh.ts";

export class SphereMesh extends TriangleMesh {
	public indices: number[];

	constructor(numStacks: number, numSectors: number) {
		super();
		this.indices = [];

		const stackStep = Math.PI / numStacks;
		const sectorStep = (2 * Math.PI) / numSectors;

		// compute vertices, normals, and UV coords
		for (let i = 0; i <= numStacks; i++) {
			const stackAngle = Math.PI / 2 - i * stackStep;
			const xy = Math.cos(stackAngle);
			const z = Math.sin(stackAngle);

			for (let j = 0; j <= numSectors; j++) {
				const sectorAngle = -j * sectorStep;

				const x = xy * Math.cos(sectorAngle);
				const y = xy * Math.sin(sectorAngle);

				this.positions.push(x, y, z);
				this.normals.push(x, y, z); // unit sphere, so vertex is normalized

				const tx = -Math.sin(sectorAngle);
				const ty = Math.cos(sectorAngle);

				this.tangents.push(tx, ty, 0);

				const s = j / numSectors;
				const t = i / numStacks;

				this.uvCoords.push(s, t);
			}
		}

		// generate CCW index list
		for (let i = 0; i < numStacks; i++) {
			let k1 = i * (numSectors + 1);
			let k2 = k1 + numSectors + 1;

			for (let j = 0; j < numSectors; j++, k1++, k2++) {
				// face triangle 1
				if (i !== 0) {
					this.indices.push(k1, k2, k1 + 1);
				}

				// face triangle 2
				if (i !== numStacks - 1) {
					this.indices.push(k1 + 1, k2, k2 + 1);
				}
			}
		}
	}
}
