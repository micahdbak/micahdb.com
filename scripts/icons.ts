// Draws the favicons and social preview from the site's JetBrains Mono font,
// with white text on a [rounded (favicons)] black background

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
	| { readonly kind: "quad"; readonly control: Point; readonly to: Point };

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

interface FontPoint {
	readonly x: number;
	readonly y: number;
	readonly on: boolean;
}

interface Glyph {
	readonly contours: readonly Contour[];
	readonly advance: number;
}

interface Icon {
	readonly polylines: readonly Point[][];
	readonly bounds: Box;
}

const OUTPUT_DIR = "build";
const FONT_PATH = join("public", "fonts", "JetBrainsMono-Regular.ttf");

const PLATE_RADIUS = 0.156; // as a share of the plate's width
const BACKGROUND: Colour = [0x00, 0x00, 0x00];
const FOREGROUND: Colour = [0xff, 0xff, 0xff];

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const OG_ICON_SIZE = 512;

const FLATTEN_STEPS = 8;

const FAVICON_OUTPUTS = [
	{ size: 16, file: "favicon-16.png", ico: true },
	{ size: 32, file: "favicon-32.png", ico: true },
	{ size: 48, file: "favicon-48.png", ico: true },
	{ size: 180, file: "apple-touch-icon.png", ico: false },
];

function fontTable(font: DataView, name: string): DataView {
	for (let i = 0, count = font.getUint16(4); i < count; i++) {
		const record = 12 + i * 16;
		const tag = String.fromCharCode(...[0, 1, 2, 3].map((at) => font.getUint8(record + at)));

		if (tag === name) {
			const offset = font.getUint32(record + 8);
			const length = font.getUint32(record + 12);

			return new DataView(font.buffer, font.byteOffset + offset, length);
		}
	}

	throw new Error(`the font has no ${name} table`);
}

// the font's unicode-to-glyph subtable; format 4 covers every drawn character
function unicodeCmap(cmap: DataView): DataView {
	for (let i = 0, count = cmap.getUint16(2); i < count; i++) {
		const record = 4 + i * 8;
		const platform = cmap.getUint16(record);
		const encoding = cmap.getUint16(record + 2);
		const subtable = new DataView(cmap.buffer, cmap.byteOffset + cmap.getUint32(record + 4));

		if ((platform === 0 || (platform === 3 && encoding === 1)) && subtable.getUint16(0) === 4) {
			return subtable;
		}
	}

	throw new Error("the font has no unicode cmap in format 4");
}

function glyphIndex(cmap: DataView, code: number): number {
	const segments = cmap.getUint16(6) / 2;
	const ends = 14;
	const starts = ends + segments * 2 + 2;
	const deltas = starts + segments * 2;
	const ranges = deltas + segments * 2;

	for (let i = 0; i < segments; i++) {
		if (code > cmap.getUint16(ends + i * 2)) {
			continue;
		}

		const start = cmap.getUint16(starts + i * 2);

		if (code < start) {
			return 0;
		}

		const delta = cmap.getInt16(deltas + i * 2);
		const range = cmap.getUint16(ranges + i * 2);

		if (range === 0) {
			return (code + delta) & 0xffff;
		}

		const at = ranges + i * 2 + range + (code - start) * 2;
		const glyph = at + 2 <= cmap.byteLength ? cmap.getUint16(at) : 0;

		return glyph === 0 ? 0 : (glyph + delta) & 0xffff;
	}

	return 0;
}

// flags arrive in runs, and each coordinate is a delta from the one before
function glyphPoints(glyph: DataView, ends: readonly number[]): FontPoint[] {
	const flags: number[] = [];
	const point_count = ends[ends.length - 1]! + 1;
	let at = 10 + ends.length * 2;

	at += 2 + glyph.getUint16(at);

	while (flags.length < point_count) {
		const flag = glyph.getUint8(at);

		at += 1;
		flags.push(flag);

		if ((flag & 0x08) !== 0) {
			const repeat = glyph.getUint8(at);

			at += 1;

			for (let i = 0; i <= repeat; i++) {
				flags.push(flag);
			}
		}
	}

	const [xs, after_x] = axis(glyph, flags, 0x02, 0x10, at);
	const [ys] = axis(glyph, flags, 0x04, 0x20, after_x);

	return flags.map((flag, i) => ({ x: xs[i]!, y: ys[i]!, on: (flag & 0x01) !== 0 }));
}

// one axis of point coordinates; all the x deltas precede all the y deltas
function axis(
	glyph: DataView,
	flags: readonly number[],
	short: number,
	same: number,
	at: number
): [number[], number] {
	const values: number[] = [];

	let value = 0;

	for (const flag of flags) {
		if ((flag & short) !== 0) {
			value += glyph.getUint8(at) * (flag & same ? 1 : -1);
			at += 1;
		} else if ((flag & same) === 0) {
			value += glyph.getInt16(at);
			at += 2;
		}

		values.push(value);
	}

	return [values, at];
}

function locaOffsets(loca: DataView, long_offsets: boolean): number[] {
	const size = long_offsets ? 4 : 2;

	return Array.from({ length: loca.byteLength / size }, (_, i) => {
		return long_offsets ? loca.getUint32(i * 4) : loca.getUint16(i * 2) * 2;
	});
}

function glyphContours(glyf: DataView, offsets: readonly number[], index: number): Contour[] {
	const start = offsets[index]!;
	const end = offsets[index + 1]!;

	if (end <= start) {
		return [];
	}

	const glyph = new DataView(glyf.buffer, glyf.byteOffset + start, end - start);
	const count = glyph.getInt16(0);

	if (count <= 0) {
		return []; // composite glyphs are not among the drawn characters
	}

	const ends = Array.from({ length: count }, (_, i) => glyph.getUint16(10 + i * 2));
	const points = glyphPoints(glyph, ends);
	const contours: Contour[] = [];

	let from = 0;

	for (const to of ends) {
		const contour = contourFrom(points.slice(from, to + 1));

		from = to + 1;

		if (contour !== null) {
			contours.push(contour);
		}
	}

	return contours;
}

// the quadratic outline of one loop, filling in the points TrueType implies
// between two consecutive off-curve points
function contourFrom(points: readonly FontPoint[]): Contour | null {
	if (points.length === 0) {
		return null;
	}

	const first = points[0]!;
	const last = points[points.length - 1]!;

	let start: Point;
	let rest: readonly FontPoint[];

	if (first.on) {
		start = [first.x, first.y];
		rest = points.slice(1);
	} else if (last.on) {
		start = [last.x, last.y];
		rest = points.slice(0, -1);
	} else {
		start = midpoint([last.x, last.y], [first.x, first.y]);
		rest = points;
	}

	const segments: Segment[] = [];

	let control: Point | null = null;

	for (const point of rest) {
		const to: Point = [point.x, point.y];

		if (!point.on) {
			if (control !== null) {
				segments.push({ kind: "quad", control, to: midpoint(control, to) });
			}

			control = to;
		} else if (control !== null) {
			segments.push({ kind: "quad", control, to });
			control = null;
		} else {
			segments.push({ kind: "line", to });
		}
	}

	if (control !== null) {
		segments.push({ kind: "quad", control, to: start });
	}

	return { start, segments };
}

function readFont(path: string, text: string): ReadonlyMap<string, Glyph> {
	const bytes = readFileSync(path);
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const cmap = unicodeCmap(fontTable(view, "cmap"));
	const glyf = fontTable(view, "glyf");
	const long_offsets = fontTable(view, "head").getInt16(50) === 1;
	const offsets = locaOffsets(fontTable(view, "loca"), long_offsets);
	const hmtx = fontTable(view, "hmtx");
	const metric_count = fontTable(view, "hhea").getUint16(34);
	const glyphs = new Map<string, Glyph>();

	for (const char of text) {
		const index = glyphIndex(cmap, char.codePointAt(0)!);

		glyphs.set(char, {
			contours: glyphContours(glyf, offsets, index),
			advance: hmtx.getUint16(Math.min(index, metric_count - 1) * 4),
		});
	}

	return glyphs;
}

function contourToPolyline({ start, segments }: Contour, steps: number): Point[] {
	const points: Point[] = [start];

	let from = start;

	for (const segment of segments) {
		if (segment.kind === "line") {
			points.push(segment.to);
		} else {
			for (let i = 1; i <= steps; i++) {
				points.push(quadAt(from, segment.control, segment.to, i / steps));
			}
		}

		from = segment.to;
	}

	return points;
}

function quadAt(from: Point, control: Point, to: Point, t: number): Point {
	const u = 1 - t;

	return [
		u * u * from[0] + 2 * u * t * control[0] + t * t * to[0],
		u * u * from[1] + 2 * u * t * control[1] + t * t * to[1],
	];
}

function midpoint(a: Point, b: Point): Point {
	return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

function boundingBox(points: readonly Point[]): Box {
	const xs = points.map(([x]) => x);
	const ys = points.map(([, y]) => y);
	const x = Math.min(...xs);
	const y = Math.min(...ys);

	return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

// every glyph's loops, in font units and along one baseline
function glyphPolylines(font: ReadonlyMap<string, Glyph>, text: string): Point[][] {
	const polylines: Point[][] = [];

	let pen = 0;

	for (const char of text) {
		const glyph = font.get(char);

		if (glyph === undefined) {
			throw new Error(`the font has no glyph for ${char}`);
		}

		for (const contour of glyph.contours) {
			const polyline = contourToPolyline(contour, FLATTEN_STEPS).map(([x, y]): Point => {
				return [x + pen, y];
			});

			polylines.push(polyline);
		}

		pen += glyph.advance;
	}

	return polylines;
}

function readIcon(text: string, text_width: number): Icon {
	const polylines = glyphPolylines(readFont(FONT_PATH, text), text);
	const ink = boundingBox(polylines.flat());
	const scale = text_width / ink.width;
	const centre: Point = [ink.x + ink.width / 2, ink.y + ink.height / 2];

	// font units are y-up, the plate is a unit square with y running down
	const placed = polylines.map((polyline) =>
		polyline.map(([x, y]): Point => {
			return [0.5 + (x - centre[0]) * scale, 0.5 - (y - centre[1]) * scale];
		})
	);

	return { polylines: placed, bounds: boundingBox(placed.flat()) };
}

// a lone ">" stays legible in a tab, where "mdb>" turns to mush
const FAVICON = readIcon(">", 0.46);
const PREVIEW = readIcon("mdb>", 0.84);

// distance to the plate's rounded rectangle, negative inside it
function plateDistance(x: number, y: number): number {
	const inner = 0.5 - PLATE_RADIUS;
	const qx = Math.abs(x - 0.5) - inner;
	const qy = Math.abs(y - 0.5) - inner;
	const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));

	return outside + Math.min(Math.max(qx, qy), 0) - PLATE_RADIUS;
}

function coverage(distance: number, units_per_pixel: number): number {
	return Math.min(Math.max(0.5 - distance / units_per_pixel, 0), 1);
}

// the non-zero winding fill rule
function winding(icon: Icon, x: number, y: number): number {
	let total = 0;

	for (const polyline of icon.polylines) {
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

function insideFill(icon: Icon, x: number, y: number): boolean {
	const { x: left, y: top, width, height } = icon.bounds;

	if (x < left || x > left + width || y < top || y > top + height) {
		return false;
	}

	return winding(icon, x, y) !== 0;
}

// the tab-sized icons are the ones on screen, so they get the finer sampling
function sampleCount(size: number): number {
	if (size <= 32) {
		return 16;
	}

	return size <= 64 ? 8 : 4;
}

function inkCoverage(
	icon: Icon,
	col: number,
	row: number,
	samples: number,
	units_per_pixel: number
): number {
	let hits = 0;

	for (let sy = 0; sy < samples; sy++) {
		for (let sx = 0; sx < samples; sx++) {
			const x = (col + (sx + 0.5) / samples) * units_per_pixel;
			const y = (row + (sy + 0.5) / samples) * units_per_pixel;

			if (insideFill(icon, x, y)) {
				hits += 1;
			}
		}
	}

	return hits / (samples * samples);
}

function renderIcon(icon: Icon, size: number): Raster {
	const units_per_pixel = 1 / size;
	const samples = sampleCount(size);
	const pixels = new Uint8Array(size * size * 4);

	for (let row = 0; row < size; row++) {
		for (let col = 0; col < size; col++) {
			const x = (col + 0.5) * units_per_pixel;
			const y = (row + 0.5) * units_per_pixel;
			const plate = coverage(plateDistance(x, y), units_per_pixel);

			if (plate === 0) {
				continue;
			}

			const ink = inkCoverage(icon, col, row, samples, units_per_pixel);
			const offset = (row * size + col) * 4;

			for (let channel = 0; channel < 3; channel++) {
				const background = BACKGROUND[channel]!;
				const foreground = FOREGROUND[channel]!;

				pixels[offset + channel] = Math.round(background + (foreground - background) * ink);
			}

			pixels[offset + 3] = Math.round(plate * 255);
		}
	}

	return { width: size, height: size, pixels };
}

// the icon centred on a black card, for link previews
function renderOg(): Raster {
	const pixels = new Uint8Array(OG_WIDTH * OG_HEIGHT * 4);
	const icon = renderIcon(PREVIEW, OG_ICON_SIZE);
	const left = Math.floor((OG_WIDTH - icon.width) / 2);
	const top = Math.floor((OG_HEIGHT - icon.height) / 2);

	// the card is opaque black, so only the alpha needs setting
	for (let i = 3; i < pixels.length; i += 4) {
		pixels[i] = 255;
	}

	for (let row = 0; row < icon.height; row++) {
		for (let col = 0; col < icon.width; col++) {
			const from = (row * icon.width + col) * 4;
			const alpha = icon.pixels[from + 3]! / 255;

			if (alpha === 0) {
				continue;
			}

			const to = ((row + top) * OG_WIDTH + col + left) * 4;

			for (let channel = 0; channel < 3; channel++) {
				pixels[to + channel] = Math.round(icon.pixels[from + channel]! * alpha);
			}
		}
	}

	return { width: OG_WIDTH, height: OG_HEIGHT, pixels };
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
	mkdirSync(OUTPUT_DIR, { recursive: true });
	mkdirSync(join(OUTPUT_DIR, "images"), { recursive: true });

	const pngs = FAVICON_OUTPUTS.map((output) => {
		return { ...output, png: encodePng(renderIcon(FAVICON, output.size)) };
	});

	for (const { file, png } of pngs) {
		const path = join(OUTPUT_DIR, file);

		writeFileSync(path, png);
		console.log(`wrote ${path}`);
	}

	const ico_path = join(OUTPUT_DIR, "favicon.ico");

	writeFileSync(ico_path, encodeIco(pngs.filter(({ ico }) => ico)));
	console.log(`wrote ${ico_path}`);

	const og_path = join(OUTPUT_DIR, "images", "og.png");

	writeFileSync(og_path, encodePng(renderOg()));
	console.log(`wrote ${og_path}`);
}

main();
