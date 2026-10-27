import { describe, expect, test } from "bun:test";

import { Pos } from "./buffer.ts";
import { Editor } from "./editor/editor.ts";

function editorWith(content: string, width = 80): Editor {
	return new Editor(content, width);
}

function runEx(editor: Editor, command: string): void {
	editor.key(":");

	if (editor.command_line !== null) {
		editor.command_line.text = command;
	}

	editor.key("enter");
}

describe("ex line jumps", () => {
	test(":2 goes to line two", () => {
		const editor = editorWith("one\ntwo\nthree");

		runEx(editor, "2");

		expect(editor.cursor.pos.line).toBe(1);
	});

	test("$ goes to the last line", () => {
		const editor = editorWith("one\ntwo\nthree");

		runEx(editor, "$");

		expect(editor.cursor.pos.line).toBe(2);
	});

	test("+1 and -1 are relative", () => {
		const editor = editorWith("one\ntwo\nthree");

		runEx(editor, "+2");
		runEx(editor, "-1");

		expect(editor.cursor.pos.line).toBe(1);
	});

	test(":0 rests on a blank first line that occupies a display row", () => {
		const editor = editorWith("\nnon-blank after a blank line");

		runEx(editor, "0");

		expect(editor.cursor.pos.line).toBe(0);
		expect(editor.cursor.pos.col).toBe(0);

		const visible = editor.layout.bufferToScreen(editor.cursor.pos);

		expect(visible).not.toBeNull();
		expect(editor.layout.displayRows.length).toBe(2);
	});

	test("a jump leaves a mark for ''", () => {
		const editor = editorWith("one\ntwo\nthree");

		runEx(editor, "3");
		editor.key("'");
		editor.key("'");

		expect(editor.cursor.pos.line).toBe(0);
	});
});

describe("ex substitute", () => {
	test(":s replaces on the current line", () => {
		const editor = editorWith("foo bar\nfoo baz");

		runEx(editor, "s/foo/qux/");

		expect(editor.buffer.lines).toEqual(["qux bar", "foo baz"]);
	});

	test(":%s replaces everywhere, /g for repeats per line", () => {
		const editor = editorWith("a a\na a");

		runEx(editor, "%s/a/b/");

		expect(editor.buffer.lines).toEqual(["b a", "b a"]);

		const all = editorWith("a a\na a");

		runEx(all, "%s/a/b/g");

		expect(all.buffer.lines).toEqual(["b b", "b b"]);
	});

	test(":s with an empty pattern reuses the last search", () => {
		const editor = editorWith("one two");

		editor.key("/");

		if (editor.command_line !== null) {
			editor.command_line.text = "one";
		}

		editor.key("enter");

		editor.cursor.setExact(new Pos(0, 0));
		runEx(editor, "s//three/");

		expect(editor.buffer.lines).toEqual(["three two"]);
	});

	test("a failed substitute flashes E486", () => {
		const editor = editorWith("one");

		runEx(editor, "s/zzz/qux/");

		expect(editor.message).toBe("E486: Pattern not found: zzz");
	});
});

describe("ex line operations", () => {
	test(":d deletes lines into the unnamed register", () => {
		const editor = editorWith("one\ntwo\nthree");

		runEx(editor, "d 2");

		expect(editor.buffer.lines).toEqual(["three"]);
		expect(editor.registers.read()?.text).toBe("one\ntwo\n");
	});

	test(":y yanks without modifying", () => {
		const editor = editorWith("one\ntwo\nthree");

		runEx(editor, "y 2");

		expect(editor.buffer.lines).toEqual(["one", "two", "three"]);
		expect(editor.registers.read()?.text).toBe("one\ntwo\n");
	});

	test(":put pastes below the cursor line", () => {
		const editor = editorWith("one\ntwo\ntwo\nthree");

		editor.cursor.setExact(new Pos(0, 0));
		runEx(editor, "d");
		runEx(editor, "+1");
		runEx(editor, "put");

		expect(editor.buffer.lines).toEqual(["two", "two", "one", "three"]);
	});
});

describe("ex file commands", () => {
	test(":w clears the modified flag and flashes the joke", () => {
		const editor = editorWith("one");

		editor.key("x");
		runEx(editor, "w");

		expect(editor.buffer.modified).toBe(false);
		expect(editor.message).toBe("Saved. (To where? There's no disk. Trust me.)");
	});

	test(":q refuses to leave, whimsically", () => {
		const editor = editorWith("one");

		runEx(editor, "q");

		expect(editor.message).toBe("Nowhere to go. You're here forever.");
	});

	test("unknown commands flash E492", () => {
		const editor = editorWith("one");

		runEx(editor, "wat");

		expect(editor.message).toBe("E492: Not an editor command: wat");
	});
});
