import { describe, expect, test } from "bun:test";

import { Buffer, Pos } from "./buffer.ts";
import { Layout } from "./layout.ts";

const BACKSLASH = String.fromCharCode(92);

// the first `count` characters of a grid's first row
function cellText(grid: { data: Uint16Array }, count: number): string {
	let text = "";

	for (let col = 0; col < count; col++) {
		text += String.fromCharCode((grid.data[col] ?? 0) & 0xff);
	}

	return text;
}

describe("anchor rendering", () => {
	test("a valid image anchor is zero-width: it hides and maps to the following glyph", () => {
		const buffer = new Buffer("ab" + BACKSLASH + "a2{pic|3|10}cd");
		const layout = new Layout(buffer, 76);

		const image = layout.images()[0];

		if (image === undefined) {
			throw new Error("expected an image anchor");
		}

		expect(image.col).toBe(2);
		expect(image.name).toBe("pic");
		expect(image.rows).toBe(3);
		expect(image.cols).toBe(10);

		// the anchor renders nothing: the line shows only its real text
		expect(cellText(layout.grid(0), 4)).toBe("abcd");

		// every anchor character maps forward to the following glyph's cell
		for (const col of [2, 5, 14]) {
			expect(layout.bufferToScreen(new Pos(0, col))).toEqual({ row: 0, col: 2 });
		}

		expect(layout.bufferToScreen(new Pos(0, 0))).toEqual({ row: 0, col: 0 });
		expect(layout.bufferToScreen(new Pos(0, 16))).toEqual({ row: 0, col: 3 });
	});

	test("an oversized image payload is clamped to the limits", () => {
		const buffer = new Buffer(BACKSLASH + "a2{huge|999|999}tail");
		const layout = new Layout(buffer, 76);

		const image = layout.images()[0];

		if (image === undefined) {
			throw new Error("expected an image anchor");
		}

		// editable text must not be able to claim an unbounded region
		expect(image.rows).toBe(40);
		expect(image.cols).toBe(80);
	});

	test("image limits are configurable per editor", () => {
		const buffer = new Buffer(BACKSLASH + "a2{pic|30|60}tail");
		const layout = new Layout(buffer, 76, { rows: 10, cols: 20 });

		expect(layout.images()[0]!.rows).toBe(10);
		expect(layout.images()[0]!.cols).toBe(20);
	});

	test("malformed image payloads claim no region", () => {
		const payloads = [
			BACKSLASH + "a2{pic|abc|def}",     // words
			BACKSLASH + "a2{pic|-5|10}",       // negative
			BACKSLASH + "a2{pic|0|10}",        // zero
			BACKSLASH + "a2{pic}",             // no size
			BACKSLASH + "a2{pic|5}",           // no width
			BACKSLASH + "a2{pic|3.7|9}",       // fractional
			BACKSLASH + "a2{pic|Infinity|9}",  // not a count
			BACKSLASH + "a2{|5|5}",            // no name
		];

		for (const payload of payloads) {
			const layout = new Layout(new Buffer(payload), 76);

			expect(layout.images()).toEqual([]);
		}
	});

	test("an image payload with padding still parses", () => {
		const buffer = new Buffer(BACKSLASH + "a2{pic| 7 | 9 }tail");
		const image = new Layout(buffer, 76).images()[0]!;

		expect({ rows: image.rows, cols: image.cols }).toEqual({ rows: 7, cols: 9 });
	});

	test("a broken anchor renders raw, backslash included", () => {
		const buffer = new Buffer(BACKSLASH + "a2{portrait|5|14");
		const layout = new Layout(buffer, 76);

		expect(layout.images().length).toBe(0);

		const grid = layout.grid(0);
		let rendered = "";

		for (let col = 0; col < 17; col++) {
			const cell = grid.data[col] ?? 0;
			rendered += String.fromCharCode(cell & 0xff);
		}

		expect(rendered).toBe(BACKSLASH + "a2{portrait|5|14");

		// the cursor maps one-to-one through the raw text
		for (const col of [0, 8, 16]) {
			expect(layout.bufferToScreen(new Pos(0, col))).toEqual({ row: 0, col });
		}
	});

	test("an image anchor past the wrap point positions its region on its own wrapped row", () => {
		const buffer = new Buffer("abcdef ghij " + BACKSLASH + "a2{pic|2|3}tail");
		const layout = new Layout(buffer, 12);

		const image = layout.images()[0];

		if (image === undefined) {
			throw new Error("expected an image anchor");
		}

		/**
		 * The twelve visible characters before the anchor fill row 0, so
		 * the region starts on row 1
		 */
		expect({ row: image.row_in_line, col: image.col }).toEqual(layout.bufferToScreen(new Pos(0, 12)));
		expect(image.row_in_line).toBe(1);
	});

	test("an image anchor's region overlays the blank rows below it", () => {
		const buffer = new Buffer(BACKSLASH + "a2{pic|3|10}\n\n\ntext after");
		const layout = new Layout(buffer, 76);

		const image = layout.images()[0];

		if (image === undefined) {
			throw new Error("expected an image anchor");
		}

		expect(image.line).toBe(0);
		expect(image.row_in_line).toBe(0);

		/**
		 * The anchor line and the blank rows are ordinary lines; text after
		 * flows below the region. Rows are group-relative; firstRowOfLine
		 * lifts them to display rows.
		 */
		expect(layout.firstRowOfLine[1]).toBe(1);
		expect(layout.firstRowOfLine[3]).toBe(3);
		expect(layout.bufferToScreen(new Pos(3, 0))).toEqual({ row: 0, col: 0 });
	});
});

describe("position mapping", () => {
	test("a run of tabs moves the cursor across its blank columns", () => {
		const buffer = new Buffer("\t\tx");
		const layout = new Layout(buffer, 76);

		// each tab owns its own blank run, so the cursor advances tab by tab
		expect(layout.bufferToScreen(new Pos(0, 0))).toEqual({ row: 0, col: 0 });
		expect(layout.bufferToScreen(new Pos(0, 1))).toEqual({ row: 0, col: 8 });
		expect(layout.bufferToScreen(new Pos(0, 2))).toEqual({ row: 0, col: 16 });

		// past the end maps to the end of the row
		expect(layout.bufferToScreen(new Pos(0, 3))).toEqual({ row: 0, col: 17 });
	});

	test("a click left of the padding clamps to the row's first character", () => {
		const buffer = new Buffer("hello");
		const layout = new Layout(buffer, 76);

		expect(layout.bufferAtVisibleCol(0, 0, -3)).toEqual(new Pos(0, 0));
	});

	test("a click past the end of a wrapped row clamps to its last character", () => {
		const buffer = new Buffer("aaaa bbbb");
		const layout = new Layout(buffer, 5);

		// row 0 is "aaaa " and row 1 is "bbbb"
		expect(layout.bufferAtVisibleCol(0, 0, 4)).toEqual(new Pos(0, 4));
		expect(layout.bufferAtVisibleCol(0, 0, 9)).toEqual(new Pos(0, 4));
		expect(layout.bufferAtVisibleCol(0, 1, 0)).toEqual(new Pos(0, 5));
	});
});

describe("raw line editing", () => {
	test("colour escapes render raw under the cursor, compiled away from it", () => {
		const buffer = new Buffer(BACKSLASH + "F3heading" + BACKSLASH + "F7");
		const layout = new Layout(buffer, 76);

		// away from the cursor the escapes compile into coloured text
		const compiled = layout.grid(0);
		expect(cellText(compiled, 7)).toBe("heading");

		// under the cursor the source shows, escapes and all
		layout.setRawLine(0);

		const raw = layout.grid(0);
		expect(cellText(raw, 13)).toBe(BACKSLASH + "F3heading" + BACKSLASH + "F7");

		layout.setRawLine(null);

		const compiled_again = layout.grid(0);
		expect(cellText(compiled_again, 7)).toBe("heading");
	});

	test("a colour-only line reports a raw row count", () => {
		const buffer = new Buffer(BACKSLASH + "F3heading" + BACKSLASH + "F7");
		const layout = new Layout(buffer, 76);

		expect(layout.rawRowCount(0)).not.toBeNull();
	});

	test("a lone backslash is not an escape and never renders raw", () => {
		const buffer = new Buffer("back\\slash");
		const layout = new Layout(buffer, 76);

		expect(layout.rawRowCount(0)).toBeNull();
		expect(cellText(layout.grid(0), 10)).toBe("back\\slash");
	});
});

describe("per-line compilation", () => {
	test("every buffer line is its own display line", () => {
		const buffer = new Buffer("one " + BACKSLASH + "\ntwo");
		const layout = new Layout(buffer, 76);

		expect(layout.displayRows.length).toBe(2);
		expect(layout.bufferToScreen(new Pos(1, 0))).toEqual({ row: 0, col: 0 });
	});

	test("a payload that does not close on its line renders raw", () => {
		const buffer = new Buffer(BACKSLASH + "a0{li" + BACKSLASH + "\nk}text");
		const layout = new Layout(buffer, 76);

		/**
		 * The anchor never resolves: no links, and both lines show their
		 * raw text with the backslash visible
		 */
		expect(layout.links().length).toBe(0);

		const expecteds: [number, string][] = [[0, BACKSLASH + "a0{li" + BACKSLASH], [1, "k}text"]];

		for (const [line, expected] of expecteds) {
			const grid = layout.grid(line);
			let rendered = "";

			for (let col = 0; col < expected.length; col++) {
				const cell = grid.data[col] ?? 0;
				rendered += String.fromCharCode(cell & 0xff);
			}

			expect(rendered).toBe(expected);
		}

		/**
		 * The cursor maps one-to-one through the raw text (rows relative to
		 * each line's own wrap)
		 */
		expect(layout.bufferToScreen(new Pos(0, 0))).toEqual({ row: 0, col: 0 });
		expect(layout.bufferToScreen(new Pos(1, 0))).toEqual({ row: 0, col: 0 });
	});
});
