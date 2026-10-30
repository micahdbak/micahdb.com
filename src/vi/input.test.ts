import { describe, expect, test } from "bun:test";

import { Pos } from "./buffer.ts";
import { Editor } from "./editor/editor.ts";
import { Input } from "./input.ts";
import { Viewport } from "./viewport.ts";

function harness(content: string) {
	// the keyboard listener targets window, which bun lacks
	(globalThis as { window: EventTarget }).window = new EventTarget();

	const editor = new Editor(content, 76);
	const viewport = new Viewport();
	const canvas = Object.assign(new EventTarget(), { rows: 30, cols: 100 });

	const input = new Input(editor, canvas as never, viewport, (row, col) => {
		return editor.layout.screenToBuffer(row, col);
	});
	input.attach();

	const wheel = (rows: number): void => {
		canvas.dispatchEvent(new CustomEvent("wheel", { detail: { rows } }));
	};

	// bun has no KeyboardEvent: a plain cancelable Event carrying the
	// fields Input reads is enough
	const press = (key: string): Event => {
		const event = new Event("keydown", { cancelable: true });

		Object.assign(event, { key, ctrlKey: false, altKey: false, metaKey: false });

		(globalThis as { window: EventTarget }).window.dispatchEvent(event);

		return event;
	};

	return { editor, wheel, press };
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

describe("tab", () => {
	test("tab is captured so the browser keeps focus", () => {
		const { press } = harness("abc");

		const event = press("Tab");

		// cancelled: the browser will not move focus off the canvas
		expect(event.defaultPrevented).toBe(true);
	});

	test("tab inserts a real tab in insert mode", () => {
		const { editor, press } = harness("abc");

		editor.key("i");
		press("Tab");

		expect(editor.buffer.lineText(0)).toBe("\tabc");
	});

	test("tab is ignored in normal mode", () => {
		const { editor, press } = harness("abc");

		press("Tab");

		expect(editor.mode).toBe("normal");
		expect(editor.buffer.lineText(0)).toBe("abc");
		expect(editor.cursor.pos.col).toBe(0);
	});
});

function dragHarness(content: string, rows = 10) {
	(globalThis as { window: EventTarget }).window = new EventTarget();

	const editor = new Editor(content, 76);
	const viewport = new Viewport();
	const canvas = Object.assign(new EventTarget(), {
		rows,
		cols: 100,
		mouse_down: false,
		mouse_row: undefined as number | undefined,
		mouse_col: undefined as number | undefined,
		mouse_down_row: undefined as number | undefined,
		mouse_down_col: undefined as number | undefined,
		mouse_owner: "",
		mouse_click: false,
	});

	const input = new Input(editor, canvas as never, viewport, (row, col) => {
		return editor.layout.screenToBuffer(viewport.top + row, col);
	});
	input.attach();

	// mirror Vi's frame order: input, clamp, then the viewport's following
	const frame = (): void => {
		editor.viewport.top = viewport.top;
		input.update();
		viewport.update(editor.layout.displayRows.length, rows);

		const visible = editor.layout.bufferToScreen(editor.cursor.pos);
		const first = editor.layout.firstRowOfLine[editor.cursor.pos.line] ?? 0;
		const cursor_row = first + visible.row;

		if (input.isPanning()) {
			viewport.holdCursor(cursor_row);
		} else {
			viewport.follow(cursor_row, editor.layout.displayRows.length, rows);
		}
	};

	const press = (row: number, col: number): void => {
		canvas.mouse_down = true;
		canvas.mouse_down_row = row;
		canvas.mouse_down_col = col;
		canvas.mouse_row = row;
		canvas.mouse_col = col;
	};

	const move = (row: number, col: number): void => {
		canvas.mouse_row = row;
		canvas.mouse_col = col;
	};

	const release = (): void => {
		canvas.mouse_down = false;
		canvas.mouse_click = true;
	};

	return { editor, viewport, frame, press, move, release };
}

const MANY_LINES = Array.from({ length: 50 }, (_, line) => `line ${line}`).join("\n");
const LONG_LINES = Array.from({ length: 300 }, (_, line) => `line ${line}`).join("\n");

describe("drag", () => {
	test("a drag places the cursor at the press and keeps it there", () => {
		const { editor, viewport, frame, press, move } = dragHarness(MANY_LINES);

		editor.placeCursor(new Pos(20, 0));
		frame();

		const start = viewport.top;

		press(3, 0);
		frame();
		move(7, 0);
		frame();

		expect(editor.cursor.pos.line).toBe(start + 3);
		expect(viewport.top).toBe(start - 4);
	});

	test("dragging down scrolls the view up without moving the cursor", () => {
		const { editor, viewport, frame, press, move } = dragHarness(MANY_LINES);

		editor.placeCursor(new Pos(20, 0));
		frame();

		const start = viewport.top;

		press(3, 0);
		frame();
		move(7, 0);
		frame();
		frame();

		expect(viewport.top).toBe(start - 4);
		expect(editor.cursor.pos.line).toBe(start + 3);
	});

	test("dragging up scrolls the view down without moving the cursor", () => {
		const { editor, viewport, frame, press, move } = dragHarness(MANY_LINES);

		editor.placeCursor(new Pos(20, 0));
		frame();

		const start = viewport.top;

		press(6, 0);
		frame();
		move(2, 0);
		frame();
		frame();

		expect(viewport.top).toBe(start + 4);
		expect(editor.cursor.pos.line).toBe(start + 6);
	});

	test("dragging past the document end clamps the view", () => {
		const { editor, viewport, frame, press, move } = dragHarness(MANY_LINES);

		editor.placeCursor(new Pos(48, 0));
		frame();

		const max_top = MANY_LINES.split("\n").length - 8;

		press(8, 0);
		frame();
		move(0, 0);
		frame();

		expect(viewport.top).toBe(max_top);
		expect(editor.cursor.pos.line).toBe(48);
	});

	test("a drag that never moves does not scroll", () => {
		const { viewport, frame, press, release } = dragHarness(MANY_LINES);

		press(4, 2);
		frame();
		release();
		frame();

		expect(viewport.top).toBe(0);
	});
});

describe("momentum", () => {
	test("releasing a drag coasts, then settles", () => {
		const { editor, viewport, frame, press, move, release } = dragHarness(LONG_LINES);

		editor.placeCursor(new Pos(200, 0));
		frame();

		press(3, 0);
		frame();
		move(7, 0);
		frame();

		const dragged = viewport.top;

		release();
		frame();

		expect(viewport.top).toBeLessThan(dragged);

		for (let i = 0; i < 300; i++) {
			frame();
		}

		const settled = viewport.top;

		expect(settled).toBeLessThan(dragged);
		frame();
		frame();

		expect(viewport.top).toBe(settled);
	});

	test("a new press stops momentum", () => {
		const { editor, viewport, frame, press, move, release } = dragHarness(LONG_LINES);

		editor.placeCursor(new Pos(200, 0));
		frame();

		press(3, 0);
		frame();
		move(7, 0);
		frame();
		release();
		frame();

		const coasting = viewport.top;

		press(5, 0);
		frame();

		expect(viewport.top).toBe(coasting);

		release();
		frame();
		frame();

		expect(viewport.top).toBe(coasting);
	});

	test("a wild pointer jump cannot fling the view past the document", () => {
		const { editor, viewport, frame, press, move, release } = dragHarness(LONG_LINES);

		editor.placeCursor(new Pos(200, 0));
		frame();

		press(0, 0);
		frame();
		move(999, 0);
		frame();
		release();

		for (let i = 0; i < 100; i++) {
			frame();
		}

		expect(viewport.top).toBe(0);
	});
});
