import { afterEach, describe, expect, test } from "bun:test";
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

const IMAGE_DOCUMENT = [
	"intro",
	"\\a2{portrait|6|12}",
	...Array<string>(5).fill(""),
	...Array.from({ length: 30 }, (_, index) => `line ${index + 1}`),
].join("\n");

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
	const original_window = Object.getOwnPropertyDescriptor(globalThis, "window");

	afterEach(() => {
		if (original_window === undefined) {
			Reflect.deleteProperty(globalThis, "window");
			return;
		}

		Object.defineProperty(globalThis, "window", original_window);
	});

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

		/**
		 * The long line's first display row runs under the bar, which paints
		 * the 80th column behind the text
		 */
		const in_text = cell(0, BAR_SCREEN_COL);

		expect(String.fromCharCode(tscon.unpackCell(in_text).char_code)).toBe("x");
		expect(tscon.unpackCell(in_text).background).toBe(tscon.Colour.BLACK);

		// the wrapped continuation row is not on the physical line
		const continuation = cell(1, BAR_SCREEN_COL);

		expect(continuation).toBe(0);
	});

	test("blank cells in the bar column fill the ruler background", () => {
		const { frame, cell } = harness(WIDTH, "tail");

		frame();

		const line = cell(0, BAR_SCREEN_COL);

		expect(tscon.unpackCell(line).char_code).toBe(32);
		expect(tscon.unpackCell(line).background).toBe(tscon.Colour.BLACK);
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
		expect(String.fromCharCode(tscon.unpackCell(value).char_code)).toBe(expected);
		expect(tscon.unpackCell(value).foreground).toBe(tscon.Colour.BG);
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

	test("image region cells leave the texture visible", () => {
		const { renderer, frame, cell } = harness(WIDTH, IMAGE_DOCUMENT);
		frame();

		expect(renderer.draws).toHaveLength(1);

		const { dst } = renderer.draws[0]!;
		expect(dst).toEqual({ row: 1, col: 2, rows: 6, cols: 12 });

		for (let row = dst.row; row < dst.row + dst.rows; row++) {

			for (let col = dst.col; col < dst.col + dst.cols; col++) {
				expect(cell(row, col)).toBe(0);
			}

		}
	});

	test("a partly off-screen image is drawn with its full sampling grid", () => {
		const { editor, canvas, renderer, viewport, frame } = harness(WIDTH, IMAGE_DOCUMENT);
		frame();

		viewport.scrollTo(3, editor.layout.displayRows.length, canvas.rows);
		expect(viewport.top).toBe(3);
		frame();

		expect(renderer.draws).toHaveLength(2);

		const { dst, glyphs } = renderer.draws[1]!;
		expect(dst).toEqual({ row: -2, col: 2, rows: 6, cols: 12 });
		expect(glyphs).toEqual(tscon.textureGlyphs(6, 12, tscon.TexGlyphMode.SAMPLE));
	});

	test("link payload glyphs overdraw the wrapped source glyphs", () => {
		const content =
			"\\a0{Docs Page|https://example.com}Docs_Page\nother";
		const { editor, viewport, frame, cell } = harness(20, content);

		editor.placeCursor(new Pos(1, 0));
		frame();
		frame();

		const link = editor.layout.links()[0]!;
		const spans = editor.layout
			.grid(link.line)
			.spansFor(link.index, link.index + "Docs Page".length);
		const line_screen_row = (editor.layout.firstRowOfLine[link.line] ?? 0) - viewport.top;
		const span = spans[0]!;
		const space = cell(line_screen_row + span.row, 2 + span.from + 4);

		expect(tscon.unpackCell(space).char_code).toBe(32);
		expect(tscon.unpackCell(space).foreground).toBe(tscon.Colour.BRIGHT_CYAN);
		expect(tscon.unpackCell(space).background).toBe(tscon.Colour.BG);
	});

	test("a hard-wrapped link is styled on every wrapped row", () => {
		const content =
			"pre \\a0{Very_Long_Link_Text|https://example.com}Very_Long_Link_Text post\nother";
		const { editor, viewport, frame, cell, text } = harness(20, content);

		editor.placeCursor(new Pos(1, 0));
		frame();
		frame();

		const link = editor.layout.links()[0]!;
		const line = editor.layout.grid(link.line);
		const spans = line.spansFor(link.index, link.index + 19);
		const line_screen_row = (editor.layout.firstRowOfLine[link.line] ?? 0) - viewport.top;

		expect(spans.length).toBeGreaterThan(1);

		for (const span of spans) {
			const value = cell(line_screen_row + span.row, 2 + span.from);

			expect(tscon.unpackCell(value).foreground).toBe(tscon.Colour.BRIGHT_CYAN);
			expect(tscon.unpackCell(value).background).toBe(tscon.Colour.BG);
		}

		expect(text(line_screen_row).trimStart()).toStartWith("pre ");
		expect(text(line_screen_row + spans[spans.length - 1]!.row)).toEndWith("post");
	});

	test("a tab before a hard-wrapped link keeps spans aligned", () => {
		const content =
			"x\t\\a0{Very_Long_Link_Text|https://example.com}Very_Long_Link_Text tail\nother";
		const { editor, viewport, frame, cell } = harness(20, content);

		editor.placeCursor(new Pos(1, 0));
		frame();
		frame();

		const link = editor.layout.links()[0]!;
		const line = editor.layout.grid(link.line);
		const spans = line.spansFor(link.index, link.index + 19);
		const line_screen_row = (editor.layout.firstRowOfLine[link.line] ?? 0) - viewport.top;

		expect(spans).toEqual([
			{ row: 0, from: 8, to: 20 },
			{ row: 1, from: 0, to: 7 },
		]);

		for (const span of spans) {
			const value = cell(line_screen_row + span.row, 2 + span.from);

			expect(tscon.unpackCell(value).foreground).toBe(tscon.Colour.BRIGHT_CYAN);
			expect(tscon.unpackCell(value).background).toBe(tscon.Colour.BG);
		}
	});

	test("hover and click work on a wrapped link's continuation row", () => {
		const content =
			"pre \\a0{Very_Long_Link_Text|https://example.com}Very_Long_Link_Text post\nother";
		const { editor, host, canvas, viewport, terminal, frame, cell } = harness(20, content);

		editor.placeCursor(new Pos(1, 0));
		frame();
		frame();

		const link = editor.layout.links()[0]!;
		const line = editor.layout.grid(link.line);
		const spans = line.spansFor(link.index, link.index + 19);
		const span = spans[spans.length - 1]!;
		const line_screen_row = (editor.layout.firstRowOfLine[link.line] ?? 0) - viewport.top;
		const row = line_screen_row + span.row;
		const col = 2 + span.from;
		const point = pointAtCell(host, canvas, row, col);

		host.pointerAtCell(row, col, canvas.rows, canvas.cols);
		frame();

		const hovered = cell(row, col);

		expect(tscon.unpackCell(hovered).foreground).toBe(tscon.Colour.BLACK);
		expect(tscon.unpackCell(hovered).background).toBe(tscon.Colour.BRIGHT_CYAN);
		expect(canvas.class_name).toBe("pointer");
		expect(terminal.detail_text).toContain("https://example.com");

		const opened: string[] = [];
		(globalThis as { window: unknown }).window = {
			open: (url: string) => opened.push(url),
		};

		host.pointerDown(point.x, point.y);
		frame();
		host.pointerUp(point.x, point.y);
		frame();

		expect(opened).toEqual(["https://example.com"]);
	});

	test("identical links on one line keep independent hover state", () => {
		const content =
			"\\a0{Same|https://example.com}Same and \\a0{Same|https://example.com}Same\nother";
		const { editor, host, canvas, viewport, frame, cell } = harness(20, content);

		editor.placeCursor(new Pos(1, 0));
		frame();
		frame();

		const links = editor.layout.links();
		const line = editor.layout.grid(links[0]!.line);
		const first_spans = line.spansFor(links[0]!.index, links[0]!.index + 4);
		const second_spans = line.spansFor(links[1]!.index, links[1]!.index + 4);
		const line_screen_row = (editor.layout.firstRowOfLine[links[0]!.line] ?? 0) - viewport.top;
		const second = second_spans[0]!;

		host.pointerAtCell(line_screen_row + second.row, 2 + second.from, canvas.rows, canvas.cols);
		frame();

		const first_cell = cell(line_screen_row + first_spans[0]!.row, 2 + first_spans[0]!.from);
		const second_cell = cell(line_screen_row + second.row, 2 + second.from);

		expect(tscon.unpackCell(first_cell).foreground).toBe(tscon.Colour.BRIGHT_CYAN);
		expect(tscon.unpackCell(first_cell).background).toBe(tscon.Colour.BG);
		expect(tscon.unpackCell(second_cell).foreground).toBe(tscon.Colour.BLACK);
		expect(tscon.unpackCell(second_cell).background).toBe(tscon.Colour.BRIGHT_CYAN);
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
