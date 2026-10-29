import * as tscon from "@micahdb/tscon";

import { TriangleIndicesMesh } from "./mesh.ts";
import type { Model } from "./model.ts";

/*
 * Minimal glTF 2.0 binary (.glb) loader for static triangle meshes.
 *
 * Supports what Blender's glTF exporter produces for a single textured mesh:
 *   - TRIANGLES primitives with POSITION, NORMAL, TEXCOORD_0, TANGENT
 *     (missing attributes are computed or filled with defaults)
 *   - node hierarchies with TRS or matrix transforms (baked into vertices)
 *   - 16- and 32-bit indices
 *
 * Does NOT support: multiple scenes, sparse accessors, normalized attribute
 * components, skins/animations, or extensions. Multiple primitives are
 * appended into one mesh (they will share one material/texture set).
 *
 * Node transforms are baked into the vertices, so the loaded mesh is in world
 * space with its own origin. The returned `Model` bounds let callers recenter
 * and normalize the scale.
 */

// glTF component types
const BYTE = 5120;
const UNSIGNED_BYTE = 5121;
const SHORT = 5122;
const UNSIGNED_SHORT = 5123;
const UNSIGNED_INT = 5125;
const FLOAT = 5126;

const COMPONENT_SIZES: Record<number, number> = {
	[BYTE]: 1,
	[UNSIGNED_BYTE]: 1,
	[SHORT]: 2,
	[UNSIGNED_SHORT]: 2,
	[UNSIGNED_INT]: 4,
	[FLOAT]: 4
};

const NUM_COMPONENTS: Record<string, number> = {
	SCALAR: 1,
	VEC2: 2,
	VEC3: 3,
	VEC4: 4,
	MAT2: 4,
	MAT3: 9,
	MAT4: 16
};

type Gltf = {
	scene?: number;
	meshes?: { primitives: GltfPrimitive[] }[];
	nodes?: GltfNode[];
	scenes?: { nodes?: number[] }[];
	accessors: GltfAccessor[];
	bufferViews: { byteOffset?: number; byteLength: number; byteStride?: number }[];
};

type GltfNode = {
	mesh?: number;
	children?: number[];
	translation?: number[];
	rotation?: number[];
	scale?: number[];
	matrix?: number[];
};

type GltfPrimitive = {
	attributes: Record<string, number>;
	indices?: number;
	mode?: number;
};

type GltfAccessor = {
	componentType: number;
	count: number;
	type: string;
	bufferView: number;
	byteOffset?: number;
	sparse?: unknown;
};

type Attribute = { data: Float32Array; count: number };

// running bounding box over all baked vertex positions
type Bounds = {
	min: [number, number, number];
	max: [number, number, number];
};

// ---------------------------------------------------------------------------
// small vector helpers; matrices are column-major, as in glTF and tscon
// ---------------------------------------------------------------------------

function normalize3(v: number[]): number[] {
	const len = Math.hypot(v[0]!, v[1]!, v[2]!) || 1;
	return [v[0]! / len, v[1]! / len, v[2]! / len];
}

function cross3(a: number[], b: number[]): number[] {
	return [
		a[1]! * b[2]! - a[2]! * b[1]!,
		a[2]! * b[0]! - a[0]! * b[2]!,
		a[0]! * b[1]! - a[1]! * b[0]!
	];
}

// point transformed by a 4x4
function transform4(m: Float32Array, x: number, y: number, z: number): number[] {
	return [
		m[0]! * x + m[4]! * y + m[8]! * z + m[12]!,
		m[1]! * x + m[5]! * y + m[9]! * z + m[13]!,
		m[2]! * x + m[6]! * y + m[10]! * z + m[14]!
	];
}

// direction transformed by the upper 3x3 of a 4x4
function transformDir4(m: Float32Array, x: number, y: number, z: number): number[] {
	return [
		m[0]! * x + m[4]! * y + m[8]! * z,
		m[1]! * x + m[5]! * y + m[9]! * z,
		m[2]! * x + m[6]! * y + m[10]! * z
	];
}

// direction transformed by a 3x3 (e.g. tscon's inverseTranspose3x3 output,
// which is a length-9 column-major array)
function transform3(m: Float32Array, x: number, y: number, z: number): number[] {
	return [
		m[0]! * x + m[3]! * y + m[6]! * z,
		m[1]! * x + m[4]! * y + m[7]! * z,
		m[2]! * x + m[5]! * y + m[8]! * z
	];
}

// ---------------------------------------------------------------------------
// accessor reading; `bin` is pre-sliced to the start of the BIN chunk
// ---------------------------------------------------------------------------

function readAccessor(json: Gltf, bin: ArrayBuffer, index: number): Attribute {
	const accessor = json.accessors[index]!;
	if (accessor.sparse) {
		throw new Error("GLB loader: sparse accessors are not supported");
	}

	const num_components = NUM_COMPONENTS[accessor.type];
	if (num_components === undefined) {
		throw new Error(`GLB loader: unsupported accessor type ${accessor.type}`);
	}

	const component_size = COMPONENT_SIZES[accessor.componentType];
	if (component_size === undefined) {
		throw new Error(`GLB loader: unsupported component type ${accessor.componentType}`);
	}

	const view = json.bufferViews[accessor.bufferView]!;
	const stride = view.byteStride ?? num_components * component_size;
	const base = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);

	const data = new Float32Array(accessor.count * num_components);
	const dv = new DataView(bin, base);

	for (let i = 0; i < accessor.count; i++) {
		const row = i * stride;

		for (let c = 0; c < num_components; c++) {
			const off = row + c * component_size;
			data[i * num_components + c] = readComponent(dv, off, accessor.componentType);
		}
	}

	return { data, count: accessor.count };
}

function readComponent(dv: DataView, off: number, component_type: number): number {
	switch (component_type) {
		case FLOAT:
			return dv.getFloat32(off, true);
		case BYTE:
			return dv.getInt8(off);
		case UNSIGNED_BYTE:
			return dv.getUint8(off);
		case SHORT:
			return dv.getInt16(off, true);
		case UNSIGNED_SHORT:
			return dv.getUint16(off, true);
		case UNSIGNED_INT:
			return dv.getUint32(off, true);
		default:
			throw new Error(`GLB loader: unsupported component type ${component_type}`);
	}
}

function readIndices(json: Gltf, bin: ArrayBuffer, index: number): number[] {
	const accessor = json.accessors[index]!;
	if (accessor.sparse) {
		throw new Error("GLB loader: sparse accessors are not supported");
	}

	const view = json.bufferViews[accessor.bufferView]!;
	const base = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
	const dv = new DataView(bin, base);

	const indices: number[] = [];

	for (let i = 0; i < accessor.count; i++) {
		switch (accessor.componentType) {
			case UNSIGNED_BYTE:
				indices.push(dv.getUint8(i));
				break;
			case UNSIGNED_SHORT:
				indices.push(dv.getUint16(i * 2, true));
				break;
			case UNSIGNED_INT:
				indices.push(dv.getUint32(i * 4, true));
				break;
			default:
				throw new Error(`GLB loader: unsupported index component type ${accessor.componentType}`);
		}
	}

	return indices;
}

// ---------------------------------------------------------------------------
// node transforms
// ---------------------------------------------------------------------------

// column-major 3x3 rotation matrix from a [x, y, z, w] quaternion
function quatToMat3(q: number[]): Float32Array {
	const [x = 0, y = 0, z = 0, w = 1] = q;

	// rows
	const r00 = 1 - 2 * (y * y + z * z);
	const r01 = 2 * (x * y - w * z);
	const r02 = 2 * (x * z + w * y);
	const r10 = 2 * (x * y + w * z);
	const r11 = 1 - 2 * (x * x + z * z);
	const r12 = 2 * (y * z - w * x);
	const r20 = 2 * (x * z - w * y);
	const r21 = 2 * (y * z + w * x);
	const r22 = 1 - 2 * (x * x + y * y);

	// column-major layout
	return new Float32Array([r00, r10, r20, r01, r11, r21, r02, r12, r22]);
}

function nodeMatrix(node: GltfNode): Float32Array {
	if (node.matrix) {
		return new Float32Array(node.matrix);
	}

	const t = node.translation ?? [0, 0, 0];
	const s = node.scale ?? [1, 1, 1];
	const r = quatToMat3(node.rotation ?? [0, 0, 0, 1]);

	// expand the 3x3 rotation into a 4x4 identity
	const r4 = tscon.Mat4.create();
	r4[0] = r[0]!;
	r4[1] = r[1]!;
	r4[2] = r[2]!;
	r4[4] = r[3]!;
	r4[5] = r[4]!;
	r4[6] = r[5]!;
	r4[8] = r[6]!;
	r4[9] = r[7]!;
	r4[10] = r[8]!;

	// M = T * R * S
	const m = tscon.Mat4.translation(t[0]!, t[1]!, t[2]!);
	tscon.Mat4.multiply(m, m, r4);
	tscon.Mat4.multiply(m, m, tscon.Mat4.scale(s[0]!, s[1]!, s[2]!));

	return m;
}

// ---------------------------------------------------------------------------
// vertex baking
// ---------------------------------------------------------------------------

// flat normal of the face containing vertex i, from baked positions
function faceNormal(world_positions: number[][], i: number): number[] {
	const ia = i - (i % 3);
	const a = world_positions[ia]!;
	const b = world_positions[ia + 1]!;
	const c = world_positions[ia + 2]!;

	const u = [b[0]! - a[0]!, b[1]! - a[1]!, b[2]! - a[2]!];
	const v = [c[0]! - a[0]!, c[1]! - a[1]!, c[2]! - a[2]!];

	return normalize3(cross3(u, v));
}

// normals need the inverse-transpose of the world matrix (correct under
// non-uniform scale); fall back to flat face normals when absent
function vertexNormal(
	normals: Attribute | null,
	normal_matrix: Float32Array,
	world_positions: number[][],
	i: number
): number[] {
	if (!normals) {
		return faceNormal(world_positions, i);
	}

	const x = normals.data[i * 3]!;
	const y = normals.data[i * 3 + 1]!;
	const z = normals.data[i * 3 + 2]!;

	return normalize3(transform3(normal_matrix, x, y, z));
}

// tangent transformed by the rotation part of the world matrix, then made
// orthogonal to the normal (glTF tangents are VEC4; the w is handedness,
// which the shader does not use). falls back to any unit vector perpendicular
// to the normal when absent.
function vertexTangent(tangents: Attribute | null, world: Float32Array, n: number[], i: number): number[] {
	if (!tangents) {
		const up = Math.abs(n[1]!) < 0.9 ? [0, 1, 0] : [1, 0, 0];
		return normalize3(cross3(up, n));
	}

	const d = transformDir4(
		world,
		tangents.data[i * 4]!,
		tangents.data[i * 4 + 1]!,
		tangents.data[i * 4 + 2]!
	);

	const dot = n[0]! * d[0]! + n[1]! * d[1]! + n[2]! * d[2]!;
	return normalize3([d[0]! - dot * n[0]!, d[1]! - dot * n[1]!, d[2]! - dot * n[2]!]);
}

// reads one TRIANGLES primitive, bakes its node transform into each vertex,
// and appends the result to `mesh`; returns the number of vertices added
function addPrimitive(
	mesh: TriangleIndicesMesh,
	json: Gltf,
	bin: ArrayBuffer,
	primitive: GltfPrimitive,
	world: Float32Array,
	bounds: Bounds,
	vertex_offset: number
): number {
	const mode = primitive.mode ?? 4;
	if (mode !== 4) {
		throw new Error("GLB loader: only TRIANGLES primitives are supported");
	}

	const position_index = primitive.attributes.POSITION;
	if (position_index === undefined) {
		throw new Error("GLB loader: primitive is missing POSITION");
	}

	const positions = readAccessor(json, bin, position_index);
	const normals = primitive.attributes.NORMAL
		? readAccessor(json, bin, primitive.attributes.NORMAL)
		: null;
	const uvs = primitive.attributes.TEXCOORD_0
		? readAccessor(json, bin, primitive.attributes.TEXCOORD_0)
		: null;
	const tangents = primitive.attributes.TANGENT
		? readAccessor(json, bin, primitive.attributes.TANGENT)
		: null;

	// normals need the inverse-transpose of the world matrix
	const normal_matrix = tscon.Mat4.create();
	tscon.Mat4.inverseTranspose3x3(normal_matrix, world);

	// bake positions first: flat-normal fallback needs neighbouring vertices
	const world_positions: number[][] = [];

	for (let i = 0; i < positions.count; i++) {
		const p = transform4(
			world,
			positions.data[i * 3]!,
			positions.data[i * 3 + 1]!,
			positions.data[i * 3 + 2]!
		);

		world_positions.push(p);

		for (let c = 0; c < 3; c++) {
			bounds.min[c] = Math.min(bounds.min[c]!, p[c]!);
			bounds.max[c] = Math.max(bounds.max[c]!, p[c]!);
		}
	}

	for (let i = 0; i < positions.count; i++) {
		const p = world_positions[i]!;
		const n = vertexNormal(normals, normal_matrix, world_positions, i);
		const t = vertexTangent(tangents, world, n, i);
		const uv_coord = uvs ? [uvs.data[i * 2]!, uvs.data[i * 2 + 1]!] : [0, 0];

		mesh.addVertex(
			[p[0]!, p[1]!, p[2]!],
			[n[0]!, n[1]!, n[2]!],
			[t[0]!, t[1]!, t[2]!],
			[uv_coord[0]!, uv_coord[1]!]
		);
	}

	const indices = primitive.indices
		? readIndices(json, bin, primitive.indices)
		: [...positions.data.keys()];

	for (const index of indices) {
		mesh.indices.push(index + vertex_offset);
	}

	return positions.count;
}

// depth-first traversal, baking each node's world transform into its mesh
function visitNode(
	json: Gltf,
	bin: ArrayBuffer,
	mesh: TriangleIndicesMesh,
	bounds: Bounds,
	node_index: number,
	parent: Float32Array,
	vertex_offset: number
): number {
	const node = json.nodes?.[node_index];
	if (!node) {
		return vertex_offset;
	}

	const world = tscon.Mat4.create();
	tscon.Mat4.multiply(world, parent, nodeMatrix(node));

	if (node.mesh !== undefined) {
		const gltf_mesh = json.meshes?.[node.mesh];

		if (gltf_mesh) {
			for (const primitive of gltf_mesh.primitives) {
				vertex_offset += addPrimitive(mesh, json, bin, primitive, world, bounds, vertex_offset);
			}
		}
	}

	for (const child of node.children ?? []) {
		vertex_offset = visitNode(json, bin, mesh, bounds, child, world, vertex_offset);
	}

	return vertex_offset;
}

// ---------------------------------------------------------------------------
// GLB container
// ---------------------------------------------------------------------------

async function parseGLB(url: string): Promise<{ json: Gltf; bin: ArrayBuffer }> {
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`GLB loader: failed to fetch ${url} (${res.status})`);
	}

	const buffer = await res.arrayBuffer();
	if (buffer.byteLength < 20) {
		throw new Error("GLB loader: file too small to be a GLB");
	}

	const header = new DataView(buffer);

	// magic "glTF", version 2
	if (header.getUint32(0, true) !== 0x46546c67) {
		throw new Error("GLB loader: bad magic");
	}
	if (header.getUint32(4, true) !== 2) {
		throw new Error("GLB loader: unsupported glTF version");
	}

	// JSON chunk, padded with spaces per spec (tolerate NUL padding too)
	const json_length = header.getUint32(12, true);
	const json_text = new TextDecoder().decode(new Uint8Array(buffer, 20, json_length));
	const json: Gltf = JSON.parse(json_text.replace(/[\0 ]+$/, ""));

	// binary chunk starts after the JSON chunk (+ padding) and its 8-byte header
	const bin = buffer.slice(20 + json_length + 8);

	return { json, bin };
}

export async function loadGLB(url: string): Promise<Model> {
	const { json, bin } = await parseGLB(url);

	const scene = json.scenes?.[json.scene ?? 0] ?? json.scenes?.[0];
	if (!scene) {
		throw new Error("GLB loader: no scene");
	}

	const mesh = new TriangleIndicesMesh();
	const bounds: Bounds = {
		min: [Infinity, Infinity, Infinity],
		max: [-Infinity, -Infinity, -Infinity]
	};

	let vertex_offset = 0;

	const identity = tscon.Mat4.create();
	for (const node_index of scene.nodes ?? []) {
		vertex_offset = visitNode(json, bin, mesh, bounds, node_index, identity, vertex_offset);
	}

	if (mesh.vertex_count === 0 || mesh.indices.length === 0) {
		throw new Error("GLB loader: no triangle mesh found in file");
	}

	const { min, max } = bounds;
	const center: [number, number, number] = [
		(min[0]! + max[0]!) / 2,
		(min[1]! + max[1]!) / 2,
		(min[2]! + max[2]!) / 2
	];

	const size: [number, number, number] = [
		max[0]! - min[0]!,
		max[1]! - min[1]!,
		max[2]! - min[2]!
	];

	const radius =
		Math.max(size[0]! / 2, size[1]! / 2, size[2]! / 2) || 1;

	return { mesh, center, radius, size };
}
