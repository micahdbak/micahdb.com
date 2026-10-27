import { describe, expect, test } from "bun:test";

import { Pos } from "./buffer.ts";
import { Editor } from "./editor/editor.ts";
import { Input } from "./input.ts";

function harness(content: string) {
	// the keyboard listener targets window, which bun lacks
	(globalThis as { window: EventTarget }).window = new EventTarget();

	const editor = new Editor(content, 76);
	const canvas = Object.assign(new EventTarget(), { rows: 30, cols: 100 });

	const input = new Input(editor, canvas as never, (row, col) => {
		return editor.layout.screenToBuffer(row, col);
	});
	input.attach();

	const wheel = (rows: number): void => {
		canvas.dispatchEvent(new CustomEvent("wheel", { detail: { rows } }));
	};

	return { editor, wheel };
}

describe("mouse wheel", () => {
	test("scrolling down moves the vi cursor down", () => {
		const { editor, wheel } = harness("a\nb\nc\nd\ne\nf\ng");

		wheel(3);

		expect(editor.cursor.pos.line).toBe(3);
	});

	test("scrolling up moves the vi cursor up", () => {
		const { editor, wheel } = harness("a\nb\nc\nd\ne\nf\ng");

		editor.placeCursor(new Pos(5, 0));
		wheel(-2);

		expect(editor.cursor.pos.line).toBe(3);
	});

	test("the wheel cannot move past the ends of the buffer", () => {
		const { editor, wheel } = harness("a\nb\nc");

		wheel(-10);
		expect(editor.cursor.pos.line).toBe(0);

		wheel(10);
		expect(editor.cursor.pos.line).toBe(2);
	});

	test("the wheel is ignored while the command line is open", () => {
		const { editor, wheel } = harness("a\nb\nc");

		editor.key(":");
		wheel(2);

		expect(editor.cursor.pos.line).toBe(0);
	});
});
