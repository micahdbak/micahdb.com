// public/favicon.svg is the original; this rasterises it into the PNGs and the
// .ico beside it, for browsers that do not take SVG icons

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

// rows top to bottom, in straight (unpremultiplied) alpha
interface Raster {
	width: number;
	height: number;
	pixels: Uint8Array;
}

type Colour = readonly [number, number, number];
type Point = readonly [number, number];

type Segment =
	| { readonly kind: "line"; readonly to: Point }
	| { readonly kind: "quad"; readonly control: Point; readonly to: Point }
	| {
			readonly kind: "cubic";
			readonly control1: Point;
			readonly control2: Point;
			readonly to: Point;
	  };

type Cubic = Extract<Segment, { readonly kind: "cubic" }>;

interface Contour {
	readonly start: Point;
	readonly segments: readonly Segment[];
}

interface Box {
	readonly x: number;
	readonly y: number;
	readonly width: number;
	readonly height: number;
}

const OUTPUT_DIR = "public";
const SVG_PATH = join(OUTPUT_DIR, "favicon.svg");

const FLATTEN_STEPS = 8;

const OUTPUTS = [
	{ size: 16, file: "favicon-16.png", ico: true },
	{ size: 32, file: "favicon-32.png", ico: true },
	{ size: 48, file: "favicon-48.png", ico: true },
	{ size: 180, file: "apple-touch-icon.png", ico: false },
];

// the attributes of the one tag named `name`, as written in the svg
function element(svg: string, name: string): Map<string, string> {
	const tag = svg.match(new RegExp(`<${name}\\b[^>]*>`));
	const attributes = new Map<string, string>();

	if (tag === null) {
		throw new Error(`the svg has no <${name}> element`);
	}

	for (const [, key = "", value = ""] of tag[0].matchAll(/([a-zA-Z-]+)="([^"]*)"/g)) {
		attributes.set(key, value);
	}

	return attributes;
}

function measure(attributes: Map<string, string>, name: string, fallback?: number): number {
	const text = attributes.get(name);

	if (text === undefined) {
		if (fallback !== undefined) {
			return fallback;
		}

		throw new Error(`an svg element is missing its ${name} attribute`);
	}

	const value = Number(text);

	if (Number.isNaN(value)) {
		throw new Error(`the svg attribute ${name}="${text}" is not a number`);
	}

	return value;
}

function colour(attributes: Map<string, string>): Colour {
	const fill = attributes.get("fill") ?? "#000000";

	if (fill === "none") {
		throw new Error("an svg element has no fill to rasterise");
	}

	const digits = fill.replace(/^#/, "");
	const full = digits.length === 3 ? [...digits].map((digit) => digit + digit).join("") : digits;

	if (!/^[0-9a-f]{6}$/i.test(full)) {
		throw new Error(`the svg colour ${fill} is not a #rgb or #rrggbb value`);
	}

	return [
		Number.parseInt(full.slice(0, 2), 16),
		Number.parseInt(full.slice(2, 4), 16),
		Number.parseInt(full.slice(4, 6), 16),
	];
}

function viewBox(attributes: Map<string, string>): Box {
	const text = attributes.get("viewBox");
	const values = text?.trim().split(/[\s,]+/).map(Number) ?? [];

	if (values.length !== 4 || values.some((value) => Number.isNaN(value))) {
		throw new Error(`the svg viewBox ${text} is not four numbers`);
	}

	const [x, y, width, height] = values as [number, number, number, number];

	if (width !== height) {
		throw new Error("the svg viewBox has to be square");
	}

	return { x, y, width, height };
}

// `m`/`l` and their relatives; `a` (arcs) is the one command left out
function parsePath(d: string): Contour[] {
	const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g);

	if (tokens === null) {
		throw new Error("the svg path holds no commands");
	}

	const contours: Contour[] = [];

	let at = 0;
	let command = "";
	let current: Point = [0, 0];
	let origin: Point = [0, 0];
	let segments: Segment[] = [];
	let control: Point | null = null;

	const number = (): number => {
		const token = tokens[at];

		at += 1;

		if (token === undefined) {
			throw new Error("the svg path ends part-way through a command");
		}

		const value = Number(token);

		if (Number.isNaN(value)) {
			throw new Error(`the svg path wants a number where ${token} appears`);
		}

		return value;
	};

	const point = (relative: boolean): Point => {
		const x = number();
		const y = number();

		return relative ? [current[0] + x, current[1] + y] : [x, y];
	};

	const add = (segment: Segment): void => {
		segments.push(segment);
		current = segment.to;

		if (segment.kind === "quad") {
			control = segment.control;
		} else if (segment.kind === "cubic") {
			control = segment.control2;
		} else {
			control = null;
		}
	};

	const close = (): void => {
		if (segments.length > 0) {
			contours.push({ start: origin, segments });
			segments = [];
		}
	};

	while (at < tokens.length) {
		const token = tokens[at]!;

		if (/[a-zA-Z]/.test(token)) {
			command = token;
			at += 1;
		} else if (command === "") {
			throw new Error("the svg path has coordinates before any command");
		}

		const kind = command.toUpperCase();
		const relative = command !== kind;

		switch (kind) {
			case "M": {
				close();
				origin = point(relative);
				current = origin;
				command = relative ? "l" : "L";
				control = null;

				break;
			}

			case "L": {
				add({ kind: "line", to: point(relative) });

				break;
			}

			case "H": {
				const x = number();

				add({ kind: "line", to: [relative ? current[0] + x : x, current[1]] });

				break;
			}

			case "V": {
				const y = number();

				add({ kind: "line", to: [current[0], relative ? current[1] + y : y] });

				break;
			}

			case "C": {
				const control1 = point(relative);
				const control2 = point(relative);

				add({ kind: "cubic", control1, control2, to: point(relative) });

				break;
			}

			case "S": {
				const control2 = point(relative);

				add({ kind: "cubic", control1: reflect(control, current), control2, to: point(relative) });

				break;
			}

			case "Q": {
				const handle = point(relative);

				add({ kind: "quad", control: handle, to: point(relative) });

				break;
			}

			case "T": {
				add({ kind: "quad", control: reflect(control, current), to: point(relative) });

				break;
			}

			case "Z": {
				close();
				current = origin;
				command = "";
				control = null;

				break;
			}

			default: {
				throw new Error(`the svg path command ${command} is not supported`);
			}
		}
	}

	close();

	return contours;
}

// the control point an S or T continues from, mirrored through the current point
function reflect(control: Point | null, current: Point): Point {
	if (control === null) {
		return current;
	}

	return [2 * current[0] - control[0], 2 * current[1] - control[1]];
}

function contourToPolyline({ start, segments }: Contour, steps: number): Point[] {
	const points: Point[] = [start];

	let from = start;

	for (const segment of segments) {
		if (segment.kind === "line") {
			points.push(segment.to);
		} else {
			for (let i = 1; i <= steps; i++) {
				const t = i / steps;
				const u = 1 - t;

				points.push(
					segment.kind === "quad"
						? quadAt(from, segment.control, segment.to, u, t)
						: cubicAt(from, segment, u, t)
				);
			}
		}

		from = segment.to;
	}

	return points;
}

function quadAt(from: Point, control: Point, to: Point, u: number, t: number): Point {
	return [
		u * u * from[0] + 2 * u * t * control[0] + t * t * to[0],
		u * u * from[1] + 2 * u * t * control[1] + t * t * to[1],
	];
}

function cubicAt(from: Point, { control1, control2, to }: Cubic, u: number, t: number): Point {
	const a = u * u * u;
	const b = 3 * u * u * t;
	const c = 3 * u * t * t;
	const d = t * t * t;

	return [
		a * from[0] + b * control1[0] + c * control2[0] + d * to[0],
		a * from[1] + b * control1[1] + c * control2[1] + d * to[1],
	];
}

function readIcon() {
	const svg = readFileSync(SVG_PATH, "utf8");
	const view = viewBox(element(svg, "svg"));
	const rect = element(svg, "rect");
	const path = element(svg, "path");
	const data = path.get("d");

	if (data === undefined) {
		throw new Error("the svg <path> is missing its d attribute");
	}

	const polylines = parsePath(data).map((contour) => contourToPolyline(contour, FLATTEN_STEPS));
	const points = polylines.flat();

	return {
		view,
		plate: {
			x: measure(rect, "x", 0),
			y: measure(rect, "y", 0),
			width: measure(rect, "width"),
			height: measure(rect, "height"),
			radius: measure(rect, "rx", 0),
		},
		background: colour(rect),
		foreground: colour(path),
		polylines,
		x_min: Math.min(...points.map(([x]) => x)),
		x_max: Math.max(...points.map(([x]) => x)),
		y_min: Math.min(...points.map(([, y]) => y)),
		y_max: Math.max(...points.map(([, y]) => y)),
	};
}

const ICON = readIcon();

// distance to the plate's rounded rectangle, negative inside it
function plateDistance(x: number, y: number): number {
	const plate = ICON.plate;
	const half_width = plate.width / 2;
	const half_height = plate.height / 2;
	const inner_x = Math.max(half_width - plate.radius, 0);
	const inner_y = Math.max(half_height - plate.radius, 0);
	const qx = Math.abs(x - (plate.x + half_width)) - inner_x;
	const qy = Math.abs(y - (plate.y + half_height)) - inner_y;
	const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));

	return outside + Math.min(Math.max(qx, qy), 0) - plate.radius;
}

function coverage(distance: number, units_per_pixel: number): number {
	return Math.min(Math.max(0.5 - distance / units_per_pixel, 0), 1);
}

// the non-zero winding number of the closed polylines around the point
function winding(x: number, y: number): number {
	let total = 0;

	for (const polyline of ICON.polylines) {
		for (let i = 0; i < polyline.length; i++) {
			const a = polyline[i]!;
			const b = polyline[(i + 1) % polyline.length]!;

			if ((a[1] <= y) === (b[1] <= y)) {
				continue;
			}

			const at = (y - a[1]) / (b[1] - a[1]);

			if (a[0] + at * (b[0] - a[0]) > x) {
				total += b[1] > a[1] ? 1 : -1;
			}
		}
	}

	return total;
}

function insideFill(x: number, y: number): boolean {
	if (x < ICON.x_min || x > ICON.x_max || y < ICON.y_min || y > ICON.y_max) {
		return false;
	}

	return winding(x, y) !== 0;
}

// the tab-sized icons are the ones on screen, so they get the finer sampling
function sampleCount(size: number): number {
	if (size <= 32) {
		return 16;
	}

	return size <= 64 ? 8 : 4;
}

function inkCoverage(col: number, row: number, samples: number, units_per_pixel: number): number {
	let hits = 0;

	for (let sy = 0; sy < samples; sy++) {
		for (let sx = 0; sx < samples; sx++) {
			const x = ICON.view.x + (col + (sx + 0.5) / samples) * units_per_pixel;
			const y = ICON.view.y + (row + (sy + 0.5) / samples) * units_per_pixel;

			if (insideFill(x, y)) {
				hits += 1;
			}
		}
	}

	return hits / (samples * samples);
}

function renderIcon(size: number): Raster {
	const units_per_pixel = ICON.view.width / size;
	const samples = sampleCount(size);
	const pixels = new Uint8Array(size * size * 4);

	for (let row = 0; row < size; row++) {
		for (let col = 0; col < size; col++) {
			const x = ICON.view.x + (col + 0.5) * units_per_pixel;
			const y = ICON.view.y + (row + 0.5) * units_per_pixel;
			const plate = coverage(plateDistance(x, y), units_per_pixel);

			if (plate === 0) {
				continue;
			}

			const ink = inkCoverage(col, row, samples, units_per_pixel);
			const offset = (row * size + col) * 4;

			for (let channel = 0; channel < 3; channel++) {
				const background = ICON.background[channel]!;
				const foreground = ICON.foreground[channel]!;

				pixels[offset + channel] = Math.round(background + (foreground - background) * ink);
			}

			pixels[offset + 3] = Math.round(plate * 255);
		}
	}

	return { width: size, height: size, pixels };
}

const CRC_TABLE = new Uint32Array(
	Array.from({ length: 256 }, (_, index) => {
		let crc = index;

		for (let bit = 0; bit < 8; bit++) {
			crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
		}

		return crc >>> 0;
	})
);

function crc32(bytes: Uint8Array): number {
	let crc = 0xffffffff;

	for (const byte of bytes) {
		crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
	}

	return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
	const chunk = new Uint8Array(data.length + 12);
	const view = new DataView(chunk.buffer);

	view.setUint32(0, data.length);

	for (let i = 0; i < 4; i++) {
		chunk[4 + i] = type.charCodeAt(i);
	}

	chunk.set(data, 8);
	view.setUint32(8 + data.length, crc32(chunk.subarray(4, 8 + data.length)));

	return chunk;
}

function encodePng(raster: Raster): Uint8Array {
	const { width, height, pixels } = raster;
	const stride = width * 4;
	const scanlines = new Uint8Array((stride + 1) * height);

	for (let row = 0; row < height; row++) {
		// a filter type precedes each scanline; 0 means the bytes are stored raw
		scanlines.set(pixels.subarray(row * stride, (row + 1) * stride), row * (stride + 1) + 1);
	}

	const header = new Uint8Array(13);
	const header_view = new DataView(header.buffer);

	header_view.setUint32(0, width);
	header_view.setUint32(4, height);
	header[8] = 8; // bits per channel
	header[9] = 6; // colour type: truecolour with alpha

	const chunks = [
		new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		pngChunk("IHDR", header),
		pngChunk("IDAT", deflateSync(scanlines)),
		pngChunk("IEND", new Uint8Array(0)),
	];

	return new Uint8Array(Buffer.concat(chunks));
}

// an .ico holds PNG payloads as readily as bitmaps, so the rasters go in as-is
function encodeIco(entries: readonly { size: number; png: Uint8Array }[]): Uint8Array {
	const header_size = 6;
	const directory_size = 16;
	const start = header_size + directory_size * entries.length;
	const total = entries.reduce((sum, entry) => sum + entry.png.length, start);
	const ico = new Uint8Array(total);
	const view = new DataView(ico.buffer);

	// an .ico is little-endian, unlike the big-endian PNG chunks it carries
	view.setUint16(2, 1, true); // resource type: icon
	view.setUint16(4, entries.length, true);

	let offset = start;

	for (const [i, entry] of entries.entries()) {
		const at = header_size + directory_size * i;

		// a dimension of 256 is written as 0
		ico[at] = entry.size % 256;
		ico[at + 1] = entry.size % 256;
		view.setUint16(at + 4, 1, true); // colour planes
		view.setUint16(at + 6, 32, true); // bits per pixel
		view.setUint32(at + 8, entry.png.length, true);
		view.setUint32(at + 12, offset, true);

		ico.set(entry.png, offset);
		offset += entry.png.length;
	}

	return ico;
}

function main() {
	const pngs = OUTPUTS.map((output) => ({ ...output, png: encodePng(renderIcon(output.size)) }));

	for (const { file, png } of pngs) {
		const path = join(OUTPUT_DIR, file);

		writeFileSync(path, png);
		console.log(`wrote ${path}`);
	}

	const ico_path = join(OUTPUT_DIR, "favicon.ico");

	writeFileSync(ico_path, encodeIco(pngs.filter(({ ico }) => ico)));
	console.log(`wrote ${ico_path}`);
}

main();
