import { describe, expect, test } from "bun:test";

import { Pos } from "./buffer.ts";
import { Editor } from "./editor/editor.ts";
import { Input } from "./input.ts";
import { View } from "./view.ts";
import CONTENT from "../pages/content/VI" with { type: "text" };
import { Viewport } from "./viewport.ts";

// the pinned render width: wide enough for the column bar to show
const WIDTH = 100;

// padding (2) plus the bar's visible column (79)
const BAR_SCREEN_COL = 81;

/**
 * A mock terminal that records what the view blits, so the full render
 * pipeline is testable without a browser
 */
class MockTerminal {
	canvas = {
		rows: 30,
		cols: WIDTH + 4,
		mouse_click: false,
		class_name: "",
		mouse_down: false,
		mouse_owner: "",
		mouse_row: undefined as number | undefined,
		mouse_col: undefined as number | undefined,
		mouse_down_row: undefined as number | undefined,
		mouse_down_col: undefined as number | undefined,
		mouseAt: (row: number, col: number, rows: number, cols: number): boolean =>
			this.pointerIn(row, col, rows, cols),
		mouseDownAt: (row: number, col: number, rows: number, cols: number): boolean =>
			this.pointerIn(row, col, rows, cols),
	};
	detail_text = "";
	cells = new Uint16Array(30 * (WIDTH + 4));

	/**
	 * Hit-tests the single pointer cell against a component's rect, like
	 * the real canvas does
	 */
	private pointerIn(row: number, col: number, rows: number, cols: number): boolean {
		const { mouse_row, mouse_col } = this.canvas;

		if (mouse_row === undefined || mouse_col === undefined) {
			return false;
		}

		return mouse_row >= row && mouse_row < row + rows && mouse_col >= col && mouse_col < col + cols;
	}

	blit(
		glyphs: { data: Uint16Array; cols: number },
		src: { row: number; col: number; rows: number; cols: number },
		dst: { row: number; col: number }
	): void {
		for (let r = 0; r < src.rows; r++) {
			for (let c = 0; c < src.cols; c++) {
				const cell = glyphs.data[(src.row + r) * glyphs.cols + (src.col + c)];

				if (cell !== undefined) {
					this.cells[(dst.row + r) * this.canvas.cols + (dst.col + c)] = cell;
				}
			}
		}
	}

	draw(): void {}
	clear(): void {
		this.cells.fill(0);
	}

	text(row: number, cols = this.canvas.cols): string {
		let text = "";

		for (let col = 0; col < cols; col++) {
			const cell = this.cells[row * this.canvas.cols + col] ?? 0;
			text += (cell & 0xff) >= 33 ? String.fromCharCode(cell & 0xff) : " ";
		}

		return text.replace(/ +$/, "");
	}

	invertedCount(row: number): number {
		let count = 0;

		for (let col = 0; col < this.canvas.cols; col++) {
			const cell = this.cells[row * this.canvas.cols + col] ?? 0;

			// the column bar is a decoration, not an overlay
			if (cell === 0 || col === BAR_SCREEN_COL) {
				continue;
			}

			const fg = (cell >> 12) & 0xf;
			const bg = (cell >> 8) & 0xf;

			// the default text is white-on-black; inverted cells are not
			if (!(fg === 15 && bg === 0) && !(fg === 0 && bg === 0)) {
				count++;
			}
		}

		return count;
	}
}

const DOCUMENT = (CONTENT as string).slice(
	(CONTENT as string).indexOf("\n", (CONTENT as string).indexOf("\n") + 1) + 1
);

function harness(width = WIDTH, content = DOCUMENT) {
	const editor = new Editor(content, width);
	const viewport = new Viewport();
	const terminal = new MockTerminal();
	const draws: Array<{ rows: number; cols: number; dst: { row: number; col: number } }> = [];
	const renderer = {
		draw: (_glyphs: unknown, _texture: unknown, dst: { row: number; col: number; rows: number; cols: number }) => {
			draws.push({ rows: dst.rows, cols: dst.cols, dst });
		},
	};
	const view = new View(terminal as never, renderer as never, {
		editor,
		layout: editor.layout,
		viewport,
		textures: new Map([["portrait", {}]]),
		image_modes: {},
		pad_cols: 2,
		filename: "VI",
	});

	const frame = (): void => {
		view.render();

		viewport.update(editor.layout.displayRows.length, 30);
		const visible = editor.layout.bufferToScreen(editor.cursor.pos);
		const first = editor.layout.firstRowOfLine[editor.cursor.pos.line] ?? 0;

		if (visible !== null) {
			viewport.follow(first + visible.row, editor.layout.displayRows.length, 30);
		}
	};

	return { editor, terminal, viewport, frame, draws };
}

describe("view rendering", () => {
	test("each wrapped row of a raw line renders its own text", () => {
		const { editor, terminal, viewport, frame } = harness(76);
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

			return terminal.text(display_index - viewport.top);
		});

		const rendered = rows.join("").replace(/\s/g, "");

		expect(rendered).toContain(raw_text.replace(/\s/g, ""));
	});

	test("the column bar paints behind text on first rows only", () => {
		const content = "x".repeat(150) + "\n" + "tail";
		const { terminal, frame } = harness(WIDTH, content);

		frame();

		const bar_bg = (cell: number) => (cell >> 8) & 0xf;

		/**
		 * The long line's first display row runs under the bar, which paints
		 * the 80th column behind the text
		 */
		const in_text = terminal.cells[BAR_SCREEN_COL]!;

		expect(String.fromCharCode(in_text & 0xff)).toBe("x");
		expect(bar_bg(in_text)).toBe(8);

		// the wrapped continuation row is not on the physical line
		const continuation = terminal.cells[terminal.canvas.cols + BAR_SCREEN_COL]!;

		expect(bar_bg(continuation)).toBe(0);
	});

	test("the cursor paints as a block, not garbage", () => {
		const { editor, terminal, viewport, frame } = harness();

		const at = new Pos(3, 2);
		const expected = editor.buffer.charAt(at)!;

		editor.placeCursor(at);
		frame();
		frame();

		const visible = editor.layout.bufferToScreen(at);
		const display_index = (editor.layout.firstRowOfLine[at.line] ?? 0) + visible.row;
		const screen_row = display_index - viewport.top;
		const cell = terminal.cells[screen_row * terminal.canvas.cols + visible.col + 2]!;

		/**
		 * The cell under the cursor is the document's own character,
		 * inverted, not a garbage glyph
		 */
		expect(String.fromCharCode(cell & 0xff)).toBe(expected);
		expect((cell >> 12) & 0xf).toBe(0);
	});

	test("a selection highlights every row it spans, including the cursor's", () => {
		const { editor, terminal, viewport, frame } = harness();
		const link_line = editor.layout.links()[0]!.line;

		editor.placeCursor(new Pos(link_line, 5));
		frame();
		frame();

		editor.selection = { anchor: new Pos(link_line - 1, 0), head: new Pos(link_line, 20) };
		frame();

		const first = (editor.layout.firstRowOfLine[link_line - 1] ?? 0) - viewport.top;
		const last_row = editor.layout.firstRowOfLine[link_line] ?? 0;
		const after = last_row + editor.layout.lineRowCount(link_line) - viewport.top;

		expect(terminal.invertedCount(first)).toBeGreaterThan(0);
		expect(terminal.invertedCount(first + 1)).toBeGreaterThan(0);
		expect(terminal.invertedCount(after)).toBe(0);
	});

	test("links light their text at the position the wrap put it on", () => {
		const { editor, terminal, viewport, frame } = harness(20);
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
		expect(terminal.text(first_screen_row)).toContain("GitHub, LinkedIn");
		expect(terminal.text(first_screen_row + 1)).toContain("the main_page");
	});

	test("an image region renders no placeholder cells; the blank rows stay transparent", () => {
		const { editor, terminal, viewport, frame } = harness();
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
		expect(terminal.text(anchor_row).trim()).toBe("");

		// the region rows render no placeholder characters
		for (let row = anchor_row + 1; row < anchor_row + image.rows; row++) {
			expect(terminal.text(row).trim()).toBe("");
		}
	});

	test("an image region draws whole while scrolled, never a squashed slice", () => {
		const { editor, terminal, viewport, frame, draws } = harness();
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

		const draw = draws[draws.length - 1]!;

		/**
		 * The full region is handed to the renderer with a negative row:
		 * the shader clips it, and the packed cell indices stay whole so
		 * the UV mapping samples the right part of the texture
		 */
		expect(draw.rows).toBe(image.rows);
		expect(draw.cols).toBe(image.cols);
		expect(draw.dst.row + draw.rows).toBeGreaterThan(terminal.canvas.rows);
	});

	test("a click activates the link, then moves the cursor onto its line", () => {
		const { editor, terminal, viewport, frame } = harness();
		const input = new Input(editor, terminal.canvas as never, (row, col) =>
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
		terminal.canvas.mouse_down = true;
		terminal.canvas.mouse_row = link_display_row - viewport.top;
		terminal.canvas.mouse_col = link.col + 2;
		frame();

		terminal.canvas.mouse_down = false;
		terminal.canvas.mouse_click = true;
		input.update();
		frame();
		input.placeClick();

		expect(opened).toEqual(["https://github.com/micahdbak"]);
		expect(editor.cursor.pos.line).toBe(link.line);
	});
});
