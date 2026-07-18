export abstract class TriangleMesh {
	static readonly STRIDE = 44;

	public positions: number[];
	public normals: number[];
	public tangents: number[];
	public uv_coords: number[];

	constructor() {
		this.positions = [];
		this.normals = [];
		this.tangents = [];
		this.uv_coords = [];
	}

	data(): Float32Array {
		const buffer = [];

		for (let i = 0; i < this.positions.length / 3; i++) {
			const base_vec3 = i * 3;
			const base_vec2 = i * 2;

			// each vertex in the vbo is layed out as position, normal, tangent, UV coord
			buffer.push(
				this.positions[base_vec3],
				this.positions[base_vec3 + 1],
				this.positions[base_vec3 + 2],
				this.normals[base_vec3],
				this.normals[base_vec3 + 1],
				this.normals[base_vec3 + 2],
				this.tangents[base_vec3],
				this.tangents[base_vec3 + 1],
				this.tangents[base_vec3 + 2],
				this.uv_coords[base_vec2],
				this.uv_coords[base_vec2 + 1]
			);
		}

		return new Float32Array(buffer);
	}

	enableAttributes(
		gl: WebGL2RenderingContext,
		vbo: WebGLBuffer,
		attributes: {
			position: number;
			normal: number;
			tangent: number;
			uv_coord: number;
		}
	) {
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

		// position
		gl.vertexAttribPointer(attributes.position, 3, gl.FLOAT, false, TriangleMesh.STRIDE, 0);
		gl.enableVertexAttribArray(attributes.position);

		// normal
		gl.vertexAttribPointer(attributes.normal, 3, gl.FLOAT, false, TriangleMesh.STRIDE, 12);
		gl.enableVertexAttribArray(attributes.normal);

		// tangent
		gl.vertexAttribPointer(attributes.tangent, 3, gl.FLOAT, false, TriangleMesh.STRIDE, 24);
		gl.enableVertexAttribArray(attributes.tangent);

		// UV coordinate
		gl.vertexAttribPointer(attributes.uv_coord, 2, gl.FLOAT, false, TriangleMesh.STRIDE, 36);
		gl.enableVertexAttribArray(attributes.uv_coord);
	}
}
