export abstract class TriangleMesh {
	public static STRIDE = 44;

	public positions: number[];
	public normals: number[];
	public tangents: number[];
	public uvCoords: number[];

	constructor() {
		this.positions = [];
		this.normals = [];
		this.tangents = [];
		this.uvCoords = [];
	}

	data(): Float32Array {
		const buffer = [];

		for (let i = 0; i < this.positions.length / 3; i++) {
			const baseVec3 = i * 3;
			const baseVec2 = i * 2;

			// each vertex in the vbo is layed out as position, normal, tangent, UV coord
			buffer.push(
				this.positions[baseVec3],
				this.positions[baseVec3 + 1],
				this.positions[baseVec3 + 2],
				this.normals[baseVec3],
				this.normals[baseVec3 + 1],
				this.normals[baseVec3 + 2],
				this.tangents[baseVec3],
				this.tangents[baseVec3 + 1],
				this.tangents[baseVec3 + 2],
				this.uvCoords[baseVec2],
				this.uvCoords[baseVec2 + 1]
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
			uvCoord: number;
		}
	) {
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

		// position
		gl.vertexAttribPointer(
			attributes.position,
			3,
			gl.FLOAT,
			false,
			TriangleMesh.STRIDE,
			0
		);
		gl.enableVertexAttribArray(attributes.position);

		// normal
		gl.vertexAttribPointer(
			attributes.normal,
			3,
			gl.FLOAT,
			false,
			TriangleMesh.STRIDE,
			12
		);
		gl.enableVertexAttribArray(attributes.normal);

		// tangent
		gl.vertexAttribPointer(
			attributes.tangent,
			3,
			gl.FLOAT,
			false,
			TriangleMesh.STRIDE,
			24
		);
		gl.enableVertexAttribArray(attributes.tangent);

		// UV coordinate
		gl.vertexAttribPointer(
			attributes.uvCoord,
			2,
			gl.FLOAT,
			false,
			TriangleMesh.STRIDE,
			36
		);
		gl.enableVertexAttribArray(attributes.uvCoord);
	}
}
