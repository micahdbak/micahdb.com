import { describe, expect, test } from "bun:test";

import { Buffer, Pos, Range } from "./buffer.ts";

describe("Buffer", () => {
	test("splits content into logical lines", () => {
		const buffer = new Buffer("one\ntwo\nthree");

		expect(buffer.lineCount()).toBe(3);
		expect(buffer.lineText(1)).toBe("two");
	});

	test("inserts within a line", () => {
		const buffer = new Buffer("hello world");

		buffer.insert(new Pos(0, 5), ",");

		expect(buffer.lineText(0)).toBe("hello, world");
	});

	test("inserts multi-line text", () => {
		const buffer = new Buffer("ab");

		buffer.insert(new Pos(0, 1), "X\nY");

		expect(buffer.lines).toEqual(["aX", "Yb"]);
	});

	test("removes charwise across lines", () => {
		const buffer = new Buffer("one\ntwo\nthree");

		buffer.remove(new Range(new Pos(0, 1), new Pos(2, 2), false));

		expect(buffer.lines).toEqual(["oree"]);
	});

	test("removes linewise", () => {
		const buffer = new Buffer("one\ntwo\nthree");

		buffer.remove(new Range(new Pos(0, 0), new Pos(1, 0), true));

		expect(buffer.lines).toEqual(["three"]);
	});

	test("removal never empties the buffer", () => {
		const buffer = new Buffer("only");

		buffer.remove(new Range(new Pos(0, 0), new Pos(0, 0), true));

		expect(buffer.lines).toEqual([""]);
	});

	test("normalizes ranges with reversed endpoints", () => {
		const buffer = new Buffer("one\ntwo\nthree");
		const range = new Range(new Pos(2, 2), new Pos(0, 1), false);

		expect(buffer.textOf(range)).toBe("ne\ntwo\nth");
	});

	test("textOf linewise keeps trailing newline", () => {
		const buffer = new Buffer("one\ntwo");

		expect(buffer.textOf(new Range(new Pos(0, 0), new Pos(0, 0), true))).toBe("one\n");
	});

	test("joinLine joins with a single space and strips leading blanks", () => {
		const buffer = new Buffer("hello\n   world");

		buffer.joinLine(0);

		expect(buffer.lineText(0)).toBe("hello world");
	});

	test("splitLine splits at the given column", () => {
		const buffer = new Buffer("hello world");

		buffer.splitLine(new Pos(0, 5));

		expect(buffer.lines).toEqual(["hello", " world"]);
	});

	test("firstNonBlank skips leading blanks", () => {
		const buffer = new Buffer("   \tfoo");

		expect(buffer.firstNonBlank(0)).toEqual(new Pos(0, 4));
	});

	test("firstNonBlank on a blank line is column 0", () => {
		const buffer = new Buffer("   ");

		expect(buffer.firstNonBlank(0)).toEqual(new Pos(0, 0));
	});

	test("Pos compares and advances through multi-line text", () => {
		const a = new Pos(1, 4);
		const b = new Pos(2, 0);

		expect(a.before(b)).toBe(true);
		expect(b.before(a)).toBe(false);
		expect(a.equals(new Pos(1, 4))).toBe(true);
		expect(a.advancedBy("xyz")).toEqual(new Pos(1, 7));
		expect(a.advancedBy("x\nyz")).toEqual(new Pos(2, 2));
	});
});
