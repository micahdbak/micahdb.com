export type Vertex = {
	position: [number, number, number];
	normal: [number, number, number];
	tangent: [number, number, number];
	uv_coord: [number, number];
};

export class TriangleMesh {
	static readonly STRIDE = 44;

	private vertices: Vertex[] = [];

	addVertex(
		position: [number, number, number],
		normal: [number, number, number],
		tangent: [number, number, number],
		uv_coord: [number, number]
	): void {
		this.vertices.push({ position, normal, tangent, uv_coord });
	}

	get vertex_count(): number {
		return this.vertices.length;
	}

	data(): Float32Array {
		const buffer: number[] = [];

		for (const { position, normal, tangent, uv_coord } of this.vertices) {
			buffer.push(...position, ...normal, ...tangent, ...uv_coord);
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

export class TriangleIndicesMesh extends TriangleMesh {
	public indices: number[] = [];
}
