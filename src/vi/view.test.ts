import { describe, expect, test } from "bun:test";
import * as tscon from "@micahdb/tscon";

import CONTENT from "../pages/content/VI" with { type: "text" };
import { Pos } from "./buffer.ts";
import { Editor } from "./editor/editor.ts";
import { Input } from "./input.ts";
import {
	RecordingRenderer,
	makeCanvas,
	pointAtCell,
	screenCell,
	screenText,
} from "./test_helpers.ts";
import { View } from "./view.ts";
import { Viewport } from "./viewport.ts";

// the pinned render width: wide enough for the column bar to show
const WIDTH = 100;

// padding (2) plus the bar's visible column (79)
const BAR_SCREEN_COL = 81;

const DOCUMENT = (CONTENT as string).slice(
	(CONTENT as string).indexOf("\n", (CONTENT as string).indexOf("\n") + 1) + 1
);

function harness(width = WIDTH, content = DOCUMENT) {
	const editor = new Editor(content, width);
	const viewport = new Viewport();
	const { host, gl, canvas } = makeCanvas(30, width + 4);
	const terminal = new tscon.Terminal(canvas);
	const renderer = new RecordingRenderer(canvas);
	const view = new View(terminal, renderer, {
		editor,
		layout: editor.layout,
		viewport,
		textures: new Map([["portrait", {} as WebGLTexture]]),
		image_modes: {},
		pad_cols: 2,
		filename: "VI",
	});

	const frame = (): void => {
		canvas.clear();
		terminal.clear();
		view.render();

		viewport.update(editor.layout.displayRows.length, canvas.rows);
		const visible = editor.layout.bufferToScreen(editor.cursor.pos);
		const first = editor.layout.firstRowOfLine[editor.cursor.pos.line] ?? 0;

		if (visible !== null) {
			viewport.follow(first + visible.row, editor.layout.displayRows.length, canvas.rows);
		}
	};

	return {
		editor,
		host,
		canvas,
		terminal,
		renderer,
		viewport,
		frame,
		text: (row: number, cols?: number) => screenText(gl, canvas, row, cols),
		cell: (row: number, col: number) => screenCell(gl, canvas, row, col),
	};
}

describe("view rendering", () => {
	test("each wrapped row of a raw line renders its own text", () => {
		const { editor, viewport, frame, text } = harness(76);
		const link_line = editor.layout.links()[0]!.line;
		const raw_text = editor.buffer.lineText(link_line);

		editor.placeCursor(new Pos(link_line + 10, 0));
		frame();
		frame();

		/**
		 * Back onto the raw line: the viewport stays put, so both of its
		 * display rows sit above the status row
		 */
		editor.placeCursor(new Pos(link_line, 0));
		frame();
		frame();

		/**
		 * The raw render can break anywhere, so join the rows and ignore
		 * the wrap
		 */
		const rows = [0, 1, 2].map((offset) => {
			const display_index = (editor.layout.firstRowOfLine[link_line] ?? 0) + offset;

			return text(display_index - viewport.top);
		});

		const rendered = rows.join("").replace(/\s/g, "");

		expect(rendered).toContain(raw_text.replace(/\s/g, ""));
	});

	test("the column bar paints behind text on first rows only", () => {
		const content = "x".repeat(150) + "\n" + "tail";
		const { frame, cell } = harness(WIDTH, content);

		frame();

		const bar_bg = (value: number) => (value >> 8) & 0xf;

		/**
		 * The long line's first display row runs under the bar, which paints
		 * the 80th column behind the text
		 */
		const in_text = cell(0, BAR_SCREEN_COL);

		expect(String.fromCharCode(in_text & 0xff)).toBe("x");
		expect(bar_bg(in_text)).toBe(8);

		// the wrapped continuation row is not on the physical line
		const continuation = cell(1, BAR_SCREEN_COL);

		expect(bar_bg(continuation)).toBe(0);
	});

	test("the cursor paints as a block, not garbage", () => {
		const { editor, viewport, frame, cell } = harness();

		const at = new Pos(3, 2);
		const expected = editor.buffer.charAt(at)!;

		editor.placeCursor(at);
		frame();
		frame();

		const visible = editor.layout.bufferToScreen(at);
		const display_index = (editor.layout.firstRowOfLine[at.line] ?? 0) + visible.row;
		const screen_row = display_index - viewport.top;
		const value = cell(screen_row, visible.col + 2);

		/**
		 * The cell under the cursor is the document's own character,
		 * inverted, not a garbage glyph
		 */
		expect(String.fromCharCode(value & 0xff)).toBe(expected);
		expect((value >> 12) & 0xf).toBe(0);
	});

	test("links light their text at the position the wrap put it on", () => {
		const { editor, viewport, frame, text } = harness(20);
		const link_line = editor.layout.links()[0]!.line;

		/**
		 * Bring the cursor past the line, so it renders in its hidden-anchor
		 * form near the viewport; the second frame paints at the followed
		 * scroll position
		 */
		editor.placeCursor(new Pos(link_line + 2, 0));
		frame();
		frame();

		const first_screen_row = editor.layout.firstRowOfLine[link_line]! - viewport.top;

		// hard wrap at 20: "GitHub, LinkedIn, an" / "d the main_page."
		expect(text(first_screen_row)).toContain("GitHub, LinkedIn");
		expect(text(first_screen_row + 1)).toContain("the main_page");
	});

	test("an image region renders no placeholder cells; the blank rows stay transparent", () => {
		const { editor, viewport, frame, text } = harness();
		const image = editor.layout.images()[0]!;

		/**
		 * The cursor rests a few lines above, so the image is on screen in
		 * its compiled form: the zero-width anchor renders nothing
		 */
		editor.placeCursor(new Pos(image.line - 3, 0));
		frame();
		frame();

		const anchor_row = editor.layout.firstRowOfLine[image.line]! - viewport.top;

		// the anchor row renders no anchor text
		expect(text(anchor_row).trim()).toBe("");

		// the region rows render no placeholder characters
		for (let row = anchor_row + 1; row < anchor_row + image.rows; row++) {
			expect(text(row).trim()).toBe("");
		}
	});

	test("an image region draws whole while scrolled, never a squashed slice", () => {
		const { editor, canvas, renderer, viewport, frame } = harness();
		const image = editor.layout.images()[0]!;

		/**
		 * Park the cursor a couple of rows below the image's top, so the
		 * viewport scrolls until only the region's tail is on screen and
		 * its top rows are clipped off
		 */
		editor.placeCursor(new Pos(image.line + 2, 0));

		for (let i = 0; i < 4; i++) {
			frame();
		}

		const first = editor.layout.firstRowOfLine[image.line] ?? 0;

		// the region's top is on screen but its tail runs past the bottom
		expect(first).toBeGreaterThanOrEqual(viewport.top);

		const draw = renderer.draws[renderer.draws.length - 1]!;

		/**
		 * The full region is handed to the renderer with a negative row:
		 * the shader clips it, and the packed cell indices stay whole so
		 * the UV mapping samples the right part of the texture
		 */
		expect(draw.dst.rows).toBe(image.rows);
		expect(draw.dst.cols).toBe(image.cols);
		expect(draw.dst.row + draw.dst.rows).toBeGreaterThan(canvas.rows);
	});

	test("a click activates the link, then moves the cursor onto its line", () => {
		const { editor, host, canvas, viewport, frame } = harness();
		const input = new Input(editor, canvas, viewport, (row, col) =>
			editor.layout.screenToBuffer(viewport.top + row, col - 2)
		);

		const opened: string[] = [];
		(globalThis as { window: unknown }).window = { open: (url: string) => opened.push(url) };

		const link = editor.layout.links()[0]!;
		const link_display_row = (editor.layout.firstRowOfLine[link.line] ?? 0) + link.row_in_line;

		// cursor away from the link's line, so the line renders as links
		editor.placeCursor(new Pos(link.line + 5, 0));
		frame();
		frame();

		// press and release on the link's screen cell
		const row = link_display_row - viewport.top;
		const col = link.col + 2;
		const point = pointAtCell(host, canvas, row, col);

		host.pointerAtCell(row, col, canvas.rows, canvas.cols);
		host.pointerDown(point.x, point.y);
		frame();

		host.pointerUp(point.x, point.y);
		input.update();
		frame();
		input.placeClick();

		expect(opened).toEqual(["https://github.com/micahdbak"]);
		expect(editor.cursor.pos.line).toBe(link.line);
	});
});
