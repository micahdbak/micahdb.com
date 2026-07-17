import { Canvas } from "./canvas.ts";
import { Terminal } from "./terminal.ts";
import { Renderer } from "./renderer.ts";
import { Scroller } from "./scroller.ts";

import { NebulaeVisuals } from "./visuals/nebulae.ts";
import { CubeVisuals } from "./visuals/cube.ts";
import { EarthVisuals } from "./visuals/earth.ts";

import { loadTexture } from "./texture.ts";

import INDEX from "./text/INDEX" with { type: "text" };

import { Link } from "./components/link.ts";

import { renderCp437 } from "./cp437.ts";
import { textGlyphs, TexGlyphMode, textureGlyphs } from "./glyphs.ts";

const PADDING_ROWS = 1;
const PADDING_COLS = 2;

const BANNER_ROW = 1;
const BANNER_ROWS = 3;

function makeBanner(file: string, title: string, cols: number) {
	const slack = cols - file.length * 2 - title.length;

	if (slack < 0) {
		return file;
	}

	const lpad = " ".repeat(Math.floor(slack / 2));
	const rpad = " ".repeat(Math.ceil(slack / 2));

	return file + lpad + title + rpad + file;
}

// cp437.html
async function render() {
	const canvas = document.getElementById("2d") as HTMLCanvasElement;
	const font = "160px 'JetBrains Mono'";
	await renderCp437(canvas, font);
}

// index.html
function main() {
	const canvas_el = document.getElementById("webgl") as HTMLCanvasElement;

	try {
		// initialize

		const canvas = new Canvas(canvas_el);
		const terminal = new Terminal(canvas);
		const renderer = new Renderer(canvas);

		// visuals

		const visuals = new EarthVisuals(canvas);
		void visuals.init();

		let visuals_glyphs = textureGlyphs(canvas.rows, canvas.cols, TexGlyphMode.GLYPHS);

		// scroller

		const scroller = new Scroller(terminal);

		// content

		// banner
		let banner = textGlyphs(
			makeBanner("INDEX(1)", "micahdb.com", canvas.cols - PADDING_COLS * 2),
			canvas.cols - PADDING_COLS * 2,
			false
		);

		// portrait
		let portrait: WebGLTexture | null = null;
		const portrait_glyphs = textureGlyphs(4, 8, TexGlyphMode.SAMPLE);

		const load_portrait = async () => {
			portrait = await loadTexture(canvas.gl, "/images/portrait.jpeg");
		};
		void load_portrait();

		// links
		const links: Link[] = [];
		const link_args = [
			["Simon Fraser University", "https://sfu.ca"],
			["Open WebUI", "https://openwebui.com"],
			["Improving", "https://improving.com"],
			["Brave Technology Coop", "https://brave.coop"],
			["<micah_baker@sfu.ca>", "mailto:micah_baker@sfu.ca"],
			["@micahdbak", "https://github.com/micahdbak"],
			["/in/micahdbak", "https://linkedin.com/in/micahdbak"],
			["/resume.pdf", "/resume.pdf"]
		];

		for (let i = 0; i < link_args.length; i++) {
			links.push(new Link(terminal, link_args[i][0], link_args[i][1]));
		}

		// actual content
		let content = textGlyphs(INDEX as string, canvas.cols - PADDING_COLS * 2, true);

		// main draw loop

		let resized = false;

		canvas.addEventListener("resize", () => {
			resized = true;
		});

		const draw = () => {
			if (resized) {
				resized = false;

				visuals.resize(canvas.rows, canvas.cols);
				visuals_glyphs = textureGlyphs(canvas.rows, canvas.cols, TexGlyphMode.GLYPHS);

				banner = textGlyphs(
					makeBanner("INDEX(1)", "micahdb.com", canvas.cols - PADDING_COLS * 2),
					canvas.cols - PADDING_COLS * 2,
					false
				);
				content = textGlyphs(INDEX as string, canvas.cols - PADDING_COLS * 2, true);
			}

			canvas.clear();

			// visuals

			visuals.render();
			renderer.draw(visuals_glyphs, visuals.texture, {
				row: 0,
				col: 0,
				rows: visuals_glyphs.rows,
				cols: visuals_glyphs.cols
			});

			// content

			terminal.clear();

			const total_rows = BANNER_ROWS + content.rows + 2;

			scroller.update(total_rows);

			const content_row = BANNER_ROWS - scroller.row;
			const content_col = PADDING_COLS;
			const content_rows = Math.min(
				canvas.rows - PADDING_ROWS,
				content.rows + BANNER_ROWS - scroller.row
			);

			terminal.blit(
				banner,
				{ row: 0, col: 0, rows: 1, cols: banner.cols },
				{ row: BANNER_ROW - scroller.row, col: PADDING_COLS, rows: 1, cols: banner.cols }
			);

			if (portrait !== null) {
				renderer.draw(portrait_glyphs, portrait, {
					row: content_row,
					col: content_col,
					rows: portrait_glyphs.rows,
					cols: portrait_glyphs.cols
				});
			}

			terminal.blit(
				content,
				{ row: scroller.row - BANNER_ROWS, col: 0, rows: content_rows, cols: content.cols },
				{ row: 0, col: content_col, rows: content_rows, cols: content.cols }
			);

			for (let i = 0; i < content.anchors.length; i++) {
				const { row, col } = content.anchors[i] as { row: number; col: number };
				const anchor_row = content_row + row;
				const anchor_col = content_col + col;

				if (anchor_row < PADDING_ROWS || anchor_row >= canvas.rows - PADDING_ROWS * 2) {
					continue;
				}

				const link = links[i];
				link.update(anchor_row, anchor_col);

				terminal.blit(
					link.glyphs,
					{ row: 0, col: 0, rows: 1, cols: link.glyphs.cols },
					{ row: anchor_row, col: anchor_col, rows: 1, cols: link.glyphs.cols }
				);
			}

			if (total_rows > canvas.rows) {
				const status_row = canvas.rows - 1 - (terminal.detail_text.length > 0 ? 1 : 0);
				terminal.blit(
					scroller.status_glyphs,
					{ row: 0, col: 0, rows: 1, cols: scroller.status_glyphs.cols },
					{ row: status_row, col: 0, rows: 1, cols: scroller.status_glyphs.cols }
				);
			}

			terminal.draw();

			canvas.mouse_click = false;

			requestAnimationFrame(draw);
		};

		requestAnimationFrame(draw);
	} catch (err: Error) {
		console.error(err);
	}
}

if (window.location.pathname === "/cp437.html") {
	await render();
} else {
	main();
}
