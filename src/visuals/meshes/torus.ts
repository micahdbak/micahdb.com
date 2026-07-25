import { TriangleIndicesMesh } from "./mesh.ts";

/*
 * Top view:
 *      _-----_
 *    .`       `.
 *   /           \
 *  (     (A) ~--(B)--~
 *   \           /
 *    `.       .'
 *      `-----`
 *
 * Side view:
 *              .---.
 *             /     \
 *  ~-----(A)-(--(B)  )
 *             \     /
 *              `---`
 *
 * Circle B is a ring, and is repeated around circle A <ring_count> times.
 * Demonstration (top view):
 *            .
 *     .      |      .
 *      \  _-(3)-_  /
 *       (4)  |  (2)
 *      /  \  '  /  \
 * ~--(5)--~:(A):~--(1)--~
 *      \  /  .  \  /
 *       (6)  |  (8)
 *      /  `-(7)-`  \
 *     '      |      `
 *            '
 *         ^^^^^^^ Placement of 8 circle B's, e.g., ring_count = 8.
 *
 * Within circle B, vertices are computed <ring_vertices times>.
 * Demonstration (side view):
 *             (3)-(2)
 *             /     \
 *  ~-----(A)(4)-(B) (1)
 *             \     /
 *             (5)-(6)
 *             ^^^^^^^ Placement of 6 vertices around one circle B.
 *
 * Circle A radius is <ar>, circle B radius is <br>.
 */
export function torusMesh(
	ring_count: number,
	ring_vertices: number,
	ar: number,
	br: number
): TriangleIndicesMesh {
	const torus = new TriangleIndicesMesh();

	const two_pi = 2.0 * Math.PI;

	// walk around circle A
	for (let i = 0; i <= ring_count; i++) {
		const u = i / ring_count;
		const theta = two_pi * u;
		const cos_theta = Math.cos(theta);
		const sin_theta = Math.sin(theta);

		// walk around circle B
		for (let j = 0; j <= ring_vertices; j++) {
			/*
			 * For some point P on some circle B placed around circle A
			 * (theta is the angle used to get the center of circle B on A,
			 * phi is the angle used to get the point P on circle B):
			 *
			 *         ^ (z+)
			 *         0------> ar
			 *         |    .---P (x, y, z)
			 *         |   /   / \
			 *  ~-----(A)-(--(B)  0 <-- P if phi = 0  -------> (x+)
			 *         |   \     /
			 *         |    `---`
			 *         |      0---> br
			 *         |      0-> br * cos(theta)
			 *         0--------> P.x = ar + br * cos(phi)
			 *         v (z-)
			 *
			 * Rotation matrix for transformation P -> P' around circle A:
			 *   R = [ cos(theta) -sin(theta) ]
			 *       [ sin(theta) cos(theta)  ]
			 *
			 * And therefore:
			 *   P' = R * P
			 *
			 * TODO (continue the explanations):
			 *                .
			 *      _-----_  P'
			 *    .`      (B')
			 *   /        /  \
			 *  (     (A)'~--(B)P-~
			 *   \           /  |
			 *    `.       .'   |
			 *      `-----`     |
			 *         0--------> P.x
			 *
			 */
			const v = j / ring_vertices;

			// UV coords
			torus.uv_coords.push(u, v);

			const phi = two_pi * v;
			const cos_phi = Math.cos(phi);
			const sin_phi = Math.sin(phi);

			// position
			const bx = ar + br * cos_phi;
			const x = cos_theta * bx;
			const y = sin_theta * bx;
			const z = br * sin_phi;
			torus.positions.push(x, y, z);

			// normal
			const nx = cos_theta * cos_phi;
			const ny = sin_theta * cos_phi;
			const nz = sin_phi;
			torus.normals.push(nx, ny, nz);

			// tangent
			const tx = -sin_theta;
			const ty = cos_theta;
			torus.tangents.push(tx, ty, 0);
		}
	}

	function index(i: number, j: number) {
		return i * (ring_vertices + 1) + j;
	}

	for (let i = 0; i < ring_count; i++) {
		for (let j = 0; j < ring_vertices; j++) {
			// corners of this quad
			const a = index(i, j);
			const b = index(i + 1, j);
			const c = index(i, j + 1);
			const d = index(i + 1, j + 1);

			// tri 1
			torus.indices.push(a);
			torus.indices.push(c);
			torus.indices.push(b);

			// tri 2
			torus.indices.push(b);
			torus.indices.push(c);
			torus.indices.push(d);
		}
	}

	return torus;
}
