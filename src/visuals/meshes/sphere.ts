import { TriangleIndicesMesh } from "./mesh.ts";

export function sphereMesh(num_stacks: number, num_sectors: number): TriangleIndicesMesh {
	const sphere = new TriangleIndicesMesh();

	const stack_step = Math.PI / num_stacks;
	const sector_step = (2 * Math.PI) / num_sectors;

	// compute vertices, normals, and UV coords
	for (let i = 0; i <= num_stacks; i++) {
		const stack_angle = Math.PI / 2 - i * stack_step;
		const xy = Math.cos(stack_angle);
		const z = Math.sin(stack_angle);

		for (let j = 0; j <= num_sectors; j++) {
			const sector_angle = -j * sector_step;

			const x = xy * Math.cos(sector_angle);
			const y = xy * Math.sin(sector_angle);

			sphere.positions.push(x, y, z);
			sphere.normals.push(x, y, z); // unit sphere, so vertex is normalized

			const tx = -Math.sin(sector_angle);
			const ty = Math.cos(sector_angle);

			sphere.tangents.push(tx, ty, 0);

			const s = j / num_sectors;
			const t = i / num_stacks;

			sphere.uv_coords.push(s, t);
		}
	}

	// generate CCW index list
	for (let i = 0; i < num_stacks; i++) {
		let k1 = i * (num_sectors + 1);
		let k2 = k1 + num_sectors + 1;

		for (let j = 0; j < num_sectors; j++, k1++, k2++) {
			// face triangle 1
			if (i !== 0) {
				sphere.indices.push(k1, k2, k1 + 1);
			}

			// face triangle 2
			if (i !== num_stacks - 1) {
				sphere.indices.push(k1 + 1, k2, k2 + 1);
			}
		}
	}

	return sphere;
}
