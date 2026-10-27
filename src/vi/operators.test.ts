import { describe, expect, test } from "bun:test";

import { Pos } from "./buffer.ts";
import { Editor } from "./editor/editor.ts";

function editorWith(content: string, width = 80): Editor {
	return new Editor(content, width);
}

function typeKeys(editor: Editor, ...keys: string[]): void {
	for (const token of keys) {
		const named = token === "esc" || token === "enter" || token.startsWith("<");
		const keystrokes = named ? [token] : [...token];

		for (const key of keystrokes) {
			editor.key(key);
		}
	}
}

function linesOf(editor: Editor): string[] {
	return editor.buffer.lines;
}

describe("operators", () => {
	test("dw deletes to the next word start", () => {
		const editor = editorWith("foo bar baz");

		typeKeys(editor, "d", "w");

		expect(linesOf(editor)).toEqual(["bar baz"]);
		expect(cursorAt(editor)).toEqual({ line: 0, col: 0 });
	});

	test("dw on a line's last word deletes to end of line, never joining", () => {
		const editor = editorWith("one two\nthree");

		editor.cursor.setExact(new Pos(0, 4));
		typeKeys(editor, "d", "w");

		expect(linesOf(editor)).toEqual(["one ", "three"]);
	});

	test("dw at a line start that ends before the next word is linewise", () => {
		const editor = editorWith("two\nthree");

		typeKeys(editor, "d", "w");

		expect(linesOf(editor)).toEqual(["three"]);
	});

	test("2d3w deletes six words", () => {
		const editor = editorWith("a b c d e f g h");

		typeKeys(editor, "2", "d", "3", "w");

		expect(linesOf(editor)).toEqual(["g h"]);
	});

	test("dd deletes the line linewise", () => {
		const editor = editorWith("one\ntwo\nthree");

		typeKeys(editor, "d", "d");

		expect(linesOf(editor)).toEqual(["two", "three"]);
	});

	test("3dd deletes three lines", () => {
		const editor = editorWith("one\ntwo\nthree\nfour");

		typeKeys(editor, "3", "d", "d");

		expect(linesOf(editor)).toEqual(["four"]);
	});

	test("cw changes the word and enters insert mode", () => {
		const editor = editorWith("foo bar");

		typeKeys(editor, "c", "w", "n", "e", "w", "esc");

		expect(linesOf(editor)).toEqual(["new bar"]);
	});

	test("cw does not swallow trailing whitespace", () => {
		const editor = editorWith("foo   bar");

		typeKeys(editor, "c", "w", "x", "esc");

		expect(linesOf(editor)).toEqual(["x   bar"]);
	});

	test("y yanks without modifying and yw lands on range start", () => {
		const editor = editorWith("foo bar");

		typeKeys(editor, "y", "w");

		expect(linesOf(editor)).toEqual(["foo bar"]);
		expect(cursorAt(editor)).toEqual({ line: 0, col: 0 });
	});

	test("> shifts linewise, 3>> shifts three lines", () => {
		const editor = editorWith("one\ntwo\nthree");

		typeKeys(editor, ">");
		typeKeys(editor, ">");

		expect(linesOf(editor)).toEqual(["\tone", "two", "three"]);

		const three = editorWith("one\ntwo\nthree");

		typeKeys(three, "3", ">", ">");

		expect(linesOf(three)).toEqual(["\tone", "\ttwo", "\tthree"]);
	});

	test("< unshifts to the previous shiftwidth", () => {
		const editor = editorWith("    one");

		typeKeys(editor, "<", "<");

		expect(linesOf(editor)).toEqual(["one"]);

		const indented = editorWith("\t  one");

		typeKeys(indented, "<", "<");

		expect(linesOf(indented)).toEqual(["\tone"]);
	});

	test("gu lowercases the motion range", () => {
		const editor = editorWith("FOO BAR");

		typeKeys(editor, "g", "u", "w");

		expect(linesOf(editor)).toEqual(["foo BAR"]);
	});

	test("d'a deletes to the mark's line", () => {
		const editor = editorWith("one\ntwo\nthree\nfour");

		editor.cursor.setExact(new Pos(1, 0));
		typeKeys(editor, "m", "a");
		editor.cursor.setExact(new Pos(3, 0));
		typeKeys(editor, "d", "'", "a");

		// linewise through the mark's line, inclusive
		expect(linesOf(editor)).toEqual(["one"]);
	});

	test("dfx deletes through the found character", () => {
		const editor = editorWith("aaxbb");

		typeKeys(editor, "d", "f", "x");

		expect(linesOf(editor)).toEqual(["bb"]);
		expect(cursorAt(editor)).toEqual({ line: 0, col: 0 });
	});

	test("dfx records the find for ;", () => {
		const editor = editorWith("aaxbb x");

		typeKeys(editor, "d", "f", "x");
		editor.key(";");

		expect(cursorAt(editor)).toEqual({ line: 0, col: 3 });
	});

	test("cc opens a blank line", () => {
		const editor = editorWith("one\ntwo\nthree");

		editor.key("j");
		typeKeys(editor, "c", "c", "X", "esc");

		expect(linesOf(editor)).toEqual(["one", "X", "three"]);
	});

	test("cc on the only line does not add a second", () => {
		const editor = editorWith("solo");

		typeKeys(editor, "c", "c", "X", "esc");

		expect(linesOf(editor)).toEqual(["X"]);
	});

	test("s deletes the character and inserts", () => {
		const editor = editorWith("hello");

		typeKeys(editor, "s", "X", "esc");

		expect(linesOf(editor)).toEqual(["Xello"]);
	});

	test("C changes to end of line from the cursor onward", () => {
		const editor = editorWith("hello world");

		editor.cursor.setExact(new Pos(0, 3));
		typeKeys(editor, "C", "p!", "esc");

		expect(linesOf(editor)).toEqual(["help!"]);
	});

	test("S clears the line and inserts", () => {
		const editor = editorWith("one\ntwo\nthree");

		editor.cursor.setExact(new Pos(1, 1));
		typeKeys(editor, "S", "TWO", "esc");

		expect(linesOf(editor)).toEqual(["one", "TWO", "three"]);
	});

	test("r replaces count characters without leaving normal mode", () => {
		const editor = editorWith("hello");

		typeKeys(editor, "3", "r", "x");

		expect(linesOf(editor)).toEqual(["xxxlo"]);
		expect(editor.mode).toBe("normal");
		expect(cursorAt(editor)).toEqual({ line: 0, col: 2 });
	});
});

function cursorAt(editor: Editor): { line: number; col: number } {
	return { line: editor.cursor.pos.line, col: editor.cursor.pos.col };
}

function renderedLine(editor: Editor, line: number): string {
	let text = "";

	for (const cell of editor.layout.grid(line).data) {
		text += String.fromCharCode(cell & 0xff);
	}

	return text.replace(/\0+$/, "");
}

describe("registers", () => {
	test("delete fills the unnamed register and the delete chain", () => {
		const editor = editorWith("one\ntwo");

		typeKeys(editor, "d", "d", "d", "d");

		expect(editor.registers.read()?.text).toBe("two\n");
		expect(editor.registers.read("1")?.text).toBe("two\n");
		expect(editor.registers.read("2")?.text).toBe("one\n");
	});

	test("yank fills the unnamed register and register 0", () => {
		const editor = editorWith("hello");

		typeKeys(editor, "y", "y");
		typeKeys(editor, "d", "d");

		expect(editor.registers.read("0")?.text).toBe("hello\n");
	});

	test("yanks leave the numbered delete chain alone", () => {
		const editor = editorWith("one\ntwo\nthree");

		typeKeys(editor, "y", "y");
		editor.key("j");
		typeKeys(editor, "d", "d");

		expect(editor.registers.read("1")?.text).toBe("two\n");
		expect(editor.registers.read("2")).toBeNull();
	});

	test("named registers hold yanks across further yanks", () => {
		const editor = editorWith("one\ntwo");

		typeKeys(editor, '"', "a", "y", "y");
		typeKeys(editor, "j");
		typeKeys(editor, '"', "a", "y", "y");

		expect(editor.registers.read("a")?.text).toBe("two\n");
	});

	test("p puts the unnamed register after the cursor", () => {
		const editor = editorWith("ab");

		editor.cursor.setExact(new Pos(0, 0));
		typeKeys(editor, "x", "p");

		expect(linesOf(editor)).toEqual(["ba"]);
	});

	test("P puts linewise above", () => {
		const editor = editorWith("one\ntwo");

		editor.cursor.setExact(new Pos(1, 0));
		typeKeys(editor, "k", "d", "d", "P");

		expect(linesOf(editor)).toEqual(["one", "two"]);
	});
});

describe("undo", () => {
	test("u restores the state before the last change", () => {
		const editor = editorWith("one two");

		typeKeys(editor, "d", "w");
		typeKeys(editor, "u");

		expect(linesOf(editor)).toEqual(["one two"]);
		expect(cursorAt(editor)).toEqual({ line: 0, col: 0 });
	});

	test("u toggles the last change back, vi style", () => {
		const editor = editorWith("one two");

		typeKeys(editor, "d", "w");
		typeKeys(editor, "u");
		typeKeys(editor, "u");

		expect(linesOf(editor)).toEqual(["two"]);
	});

	test("u stops flashing at the oldest change", () => {
		const editor = editorWith("one");

		editor.key("u");

		expect(editor.message).toBe("Already at oldest change");
	});

	test("U undoes all changes to the most recently changed line", () => {
		const editor = editorWith("hello");

		editor.cursor.setExact(new Pos(0, 0));
		typeKeys(editor, "x", "x", "U");

		expect(linesOf(editor)).toEqual(["hello"]);
	});

	test("a yank does not clobber the undo snapshot", () => {
		const editor = editorWith("hello");

		typeKeys(editor, "x", "y", "y", "u");

		expect(linesOf(editor)).toEqual(["hello"]);
	});
});

describe("sugar commands", () => {
	test("x deletes at the cursor and stops at end of line", () => {
		const editor = editorWith("foo");

		typeKeys(editor, "2", "x");

		expect(linesOf(editor)).toEqual(["o"]);
	});

	test("3x deletes only to end of line", () => {
		const editor = editorWith("foo");

		typeKeys(editor, "3", "x");

		expect(linesOf(editor)).toEqual([""]);
	});

	test("D deletes to end of line", () => {
		const editor = editorWith("foo bar");

		editor.cursor.setExact(new Pos(0, 3));
		typeKeys(editor, "D");

		expect(linesOf(editor)).toEqual(["foo"]);
	});

	test("backspace at a line start joins the split exactly, no separator", () => {
		const editor = editorWith("word");

		editor.cursor.setExact(new Pos(0, 2));
		typeKeys(editor, "i", "enter", "<bs>");

		expect(linesOf(editor)).toEqual(["word"]);
		expect(cursorAt(editor)).toEqual({ line: 0, col: 2 });
	});

	test("J joins with a single space and rests on the join column", () => {
		const editor = editorWith("one\ntwo");

		typeKeys(editor, "J");

		expect(linesOf(editor)).toEqual(["one two"]);
		expect(cursorAt(editor)).toEqual({ line: 0, col: 3 });
	});

	test("~ toggles case and advances", () => {
		const editor = editorWith("aBc");

		typeKeys(editor, "3", "~");

		expect(linesOf(editor)).toEqual(["AbC"]);
	});
});

describe("insert sessions", () => {
	test("typing on a line joined above the session start recompiles it", () => {
		const editor = editorWith("one\ntwo");

		editor.cursor.setExact(new Pos(1, 0));
		typeKeys(editor, "i", "<bs>");

		// the joined line renders and caches before the next keystroke
		editor.layout.grid(0);

		typeKeys(editor, " ");

		expect(renderedLine(editor, 0)).toBe(editor.buffer.lineText(0));
	});

	test("enter above the session start recompiles the split line", () => {
		const editor = editorWith("one\ntwo\nthree");

		editor.cursor.setExact(new Pos(2, 0));
		typeKeys(editor, "i", "<up>", "<up>", "<right>");

		// line 0 renders and caches before the split
		editor.layout.grid(0);

		typeKeys(editor, "enter");

		expect(renderedLine(editor, 0)).toBe(editor.buffer.lineText(0));
	});

	test("escape after only deletions leaves the cursor where it is", () => {
		const editor = editorWith("hello world");

		editor.cursor.setExact(new Pos(0, 6));
		typeKeys(editor, "i", "<bs>", "<bs>", "<bs>", "esc");

		// real vi rests the cursor where the edits left it; it does not
		// rewind to the session start
		expect(cursorAt(editor)).toEqual({ line: 0, col: 3 });
	});

	test("escape after deletions on a wrapped line's second row stays put", () => {
		const editor = editorWith("aaaa bbbb cccc dddd eeee", 10);

		// the second display row starts at buffer column 10
		editor.placeCursor(new Pos(0, 12));
		typeKeys(editor, "i", "<bs>", "<bs>", "<bs>", "esc");

		expect(cursorAt(editor)).toEqual({ line: 0, col: 9 });
	});

	test("exiting insert on a line above the session start recompiles it", () => {
		const editor = editorWith("one\ntwo\nthree");

		editor.cursor.setExact(new Pos(2, 0));
		typeKeys(editor, "2", "i", "<up>", "<up>", "<right>");

		editor.layout.grid(0);

		// the exit duplicates the typed X onto this line
		typeKeys(editor, "X", "esc");

		expect(renderedLine(editor, 0)).toBe(editor.buffer.lineText(0));
	});
});

describe("repeat", () => {
	test(". repeats an operator command", () => {
		const editor = editorWith("a b c d e f");

		typeKeys(editor, "d", "w");
		typeKeys(editor, ".");

		expect(linesOf(editor)).toEqual(["c d e f"]);
	});

	test(". repeats an insert session", () => {
		const editor = editorWith("ab_cd");

		typeKeys(editor, "f", "_", "a", "*", "esc");

		expect(linesOf(editor)).toEqual(["ab_*cd"]);

		editor.key(".");

		expect(linesOf(editor)).toEqual(["ab_**cd"]);
	});

	test(". after cw repeats the change", () => {
		const editor = editorWith("foo bar baz");

		typeKeys(editor, "c", "w", "hi", "esc");
		typeKeys(editor, "w");
		typeKeys(editor, ".");

		expect(linesOf(editor)).toEqual(["hi hi baz"]);
	});

	test(". after 3i duplicates the text three times", () => {
		const editor = editorWith("start");

		// the cursor cannot rest past the last character, so 3i inserts
		// before the final t
		editor.cursor.setExact(new Pos(0, 4));
		typeKeys(editor, "3", "i", "ha", "esc");

		expect(linesOf(editor)).toEqual(["starhahahat"]);
	});

	test(". after s repeats the change", () => {
		const editor = editorWith("hello");

		typeKeys(editor, "s", "X", "esc");
		editor.key("l");
		editor.key(".");

		expect(linesOf(editor)).toEqual(["XXllo"]);
	});

	test(". after r repeats the replacement", () => {
		const editor = editorWith("hello");

		typeKeys(editor, "r", "x");
		editor.key("l");
		editor.key(".");

		expect(linesOf(editor)).toEqual(["xxllo"]);
	});

	test(". after R overwrites again and undoes as its own change", () => {
		const editor = editorWith("hello world");

		typeKeys(editor, "R", "XYZ", "esc");
		expect(linesOf(editor)).toEqual(["XYZlo world"]);

		editor.key(".");
		expect(linesOf(editor)).toEqual(["XYXYZ world"]);

		editor.key("u");
		expect(linesOf(editor)).toEqual(["XYZlo world"]);
	});
});
