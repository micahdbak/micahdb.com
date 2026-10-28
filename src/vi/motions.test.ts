import { describe, expect, test } from "bun:test";

const BACKSLASH = String.fromCharCode(92);

import { Pos } from "./buffer.ts";
import { Editor } from "./editor/editor.ts";

function editorWith(content: string, width = 80): Editor {
	return new Editor(content, width);
}

function cursorAt(editor: Editor): { line: number; col: number } {
	return { line: editor.cursor.pos.line, col: editor.cursor.pos.col };
}

describe("word motions", () => {
	test("w moves to the next word start", () => {
		const editor = editorWith("foo bar baz");

		editor.key("w");

		expect(cursorAt(editor)).toEqual({ line: 0, col: 4 });
	});

	test("w stops at empty lines", () => {
		const editor = editorWith("foo\n\nbar");

		editor.key("w");

		expect(cursorAt(editor)).toEqual({ line: 1, col: 0 });
	});

	test("w from a line's last word crosses to the next line", () => {
		const editor = editorWith("foo bar\nbaz");

		editor.cursor.setExact(new Pos(0, 4));
		editor.key("w");

		expect(cursorAt(editor)).toEqual({ line: 1, col: 0 });
	});

	test("W treats punctuation as word characters", () => {
		const editor = editorWith("a.b c");

		editor.key("W");

		expect(cursorAt(editor)).toEqual({ line: 0, col: 4 });
	});

	test("b moves back to the current word start", () => {
		const editor = editorWith("foo bar baz");

		editor.cursor.setExact(new Pos(0, 5));
		editor.key("b");

		expect(cursorAt(editor)).toEqual({ line: 0, col: 4 });
	});

	test("e moves to the end of the current word", () => {
		const editor = editorWith("foo bar");

		editor.key("e");

		expect(cursorAt(editor)).toEqual({ line: 0, col: 2 });
	});

	test("e crosses empty lines", () => {
		const editor = editorWith("foo\n\nbar");

		editor.cursor.setExact(new Pos(0, 2));
		editor.key("e");

		expect(cursorAt(editor)).toEqual({ line: 2, col: 2 });
	});

	test("ge moves to the end of the previous word", () => {
		const editor = editorWith("foo bar baz");

		editor.cursor.setExact(new Pos(0, 8));
		editor.key("g");
		editor.key("e");

		expect(cursorAt(editor)).toEqual({ line: 0, col: 6 });
	});

	test("ge from a word's start lands on the previous word's end", () => {
		const editor = editorWith("foo bar");

		editor.cursor.setExact(new Pos(0, 4));
		editor.key("g");
		editor.key("e");

		expect(cursorAt(editor)).toEqual({ line: 0, col: 2 });
	});

	test("gE treats punctuation as word characters", () => {
		const editor = editorWith("foo BAR, baz");

		editor.cursor.setExact(new Pos(0, 11));
		editor.key("g");
		editor.key("E");

		expect(cursorAt(editor)).toEqual({ line: 0, col: 7 });
	});

	test("ge crosses to the end of the previous line's last word", () => {
		const editor = editorWith("foo\nbar");

		editor.cursor.setExact(new Pos(1, 0));
		editor.key("g");
		editor.key("e");

		expect(cursorAt(editor)).toEqual({ line: 0, col: 2 });
	});

	test("3ge repeats three times", () => {
		const editor = editorWith("aa bb cc dd ee");

		editor.cursor.setExact(new Pos(0, 13));
		editor.key("3");
		editor.key("g");
		editor.key("e");

		expect(cursorAt(editor)).toEqual({ line: 0, col: 4 });
	});
});

describe("char search motions", () => {
	test("f finds forward on the line", () => {
		const editor = editorWith("hello world");

		editor.key("f");
		editor.key("o");

		expect(cursorAt(editor)).toEqual({ line: 0, col: 4 });
	});

	test("t lands one before the target", () => {
		const editor = editorWith("hello world");

		editor.key("t");
		editor.key("o");

		expect(cursorAt(editor)).toEqual({ line: 0, col: 3 });
	});

	test("; repeats the last find", () => {
		const editor = editorWith("hello world");

		editor.key("f");
		editor.key("o");
		editor.key(";");

		expect(cursorAt(editor)).toEqual({ line: 0, col: 7 });
	});

	test("f never leaves the line", () => {
		const editor = editorWith("hello\nworld");

		editor.key("f");
		editor.key("w");

		expect(cursorAt(editor)).toEqual({ line: 0, col: 0 });
	});
});

describe("line motions", () => {
	test("$ goes to the last visible character", () => {
		const editor = editorWith("hello");

		editor.key("$");

		expect(cursorAt(editor)).toEqual({ line: 0, col: 4 });
	});

	test("G without a count goes to the last line", () => {
		const editor = editorWith("a\nb\nc");

		editor.key("G");

		expect(cursorAt(editor)).toEqual({ line: 2, col: 0 });
	});

	test("3G goes to line three", () => {
		const editor = editorWith("a\nb\nc");

		editor.key("3");
		editor.key("G");

		expect(cursorAt(editor)).toEqual({ line: 2, col: 0 });
	});

	test("% matches brackets across lines", () => {
		const editor = editorWith("foo\n(bar)\nbaz");

		editor.cursor.setExact(new Pos(1, 0));
		editor.key("%");

		expect(cursorAt(editor)).toEqual({ line: 1, col: 4 });
	});
});

describe("wrap-aware vertical motion", () => {
	test("j moves by display rows through a wrapped line", () => {
		const editor = editorWith("aaaa bbbb cccc dddd", 10);

		editor.key("j");

		expect(cursorAt(editor)).toEqual({ line: 0, col: 10 });
	});

	test("j keeps the sticky column across lines", () => {
		const editor = editorWith("aaaa bbbb cccc\nxy", 15);

		editor.cursor.setExact(new Pos(0, 10));
		editor.key("j");

		expect(cursorAt(editor)).toEqual({ line: 1, col: 1 });
	});

	test("k enters a raw anchor line at its bottom row", () => {
		const links = BACKSLASH + "a0{GitHub|https://github.com/micahdbak}GitHub, "
			+ BACKSLASH + "a0{LinkedIn|https://linkedin.com/in/micahdbak}LinkedIn";

		const editor = editorWith(links + "\nbelow", 30);

		/**
		 * Below the anchor line: its rendered form is one row, its raw form
		 * wraps to several
		 */
		editor.placeCursor(new Pos(1, 10));
		editor.key("k");

		const raw_rows = editor.layout.rawRowCount(0)!;
		const visible = editor.layout.bufferToScreen(editor.cursor.pos);

		expect(visible).not.toBeNull();
		expect(visible!.row).toBe(raw_rows - 1);
	});

	test("j enters a raw anchor line at its top row", () => {
		const links = BACKSLASH + "a0{GitHub|https://github.com/micahdbak}GitHub, "
			+ BACKSLASH + "a0{LinkedIn|https://linkedin.com/in/micahdbak}LinkedIn";

		const editor = editorWith(links, 30);

		editor.placeCursor(new Pos(-1 + 1, 0));
		editor.placeCursor(new Pos(0, 0));
		editor.key("j");

		const visible = editor.layout.bufferToScreen(editor.cursor.pos);

		expect(visible).not.toBeNull();
		expect(visible!.row).toBe(0);
	});
});
