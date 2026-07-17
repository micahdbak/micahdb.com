import { Canvas } from "./canvas.ts";
import { Terminal } from "./terminal.ts";
import { Renderer } from "./renderer.ts";
import { Scroller } from "./scroller.ts";

//import { NebulaeVisuals } from "./visuals/nebulae.ts";
//import { CubeVisuals } from "./visuals/cube.ts";
import { EarthVisuals } from "./visuals/earth.ts";

import { loadTexture } from "./texture.ts";

import INDEX from "./text/INDEX" with { type: "text" };

import { Link } from "./components/link.ts";
import { Section } from "./components/section.ts";

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
			makeBanner("INDEX", "micahdb.com", canvas.cols - PADDING_COLS * 2),
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

		const links: Link[] = [];

		for (let i = 0; i < link_args.length; i++) {
			links.push(new Link(terminal, link_args[i][0], link_args[i][1]));
		}

		// sections
		const section_args = ["NAME", "SYNOPSIS", "DESCRIPTION", "EDUCATION", "EXPERIENCE", "PROJECTS"];

		const sections: Section[] = [];

		for (let i = 0; i < section_args.length; i++) {
			const anchor = "#" + section_args[i].toLowerCase(0);
			sections.push(new Section(terminal, section_args[i], anchor));
		}

		// actual content
		let content = textGlyphs(INDEX as string, canvas.cols - PADDING_COLS * 2, true);

		// main draw loop

		let resized = false;

		canvas.addEventListener("resize", () => {
			resized = true;
		});

		// scroll to anchor on load
		if (window.location.hash !== "") {
			const section_text = window.location.hash.slice(1).toUpperCase();
			const i = section_args.indexOf(section_text);

			if (i >= 0) {
				console.log(`scrolling to section ${section_text}`);
				scroller.scrollToRow(
					BANNER_ROWS + content.anchors[9][i].row - 1,
					BANNER_ROWS + content.rows + 2
				);
			}
		}

		const draw = () => {
			if (resized) {
				resized = false;

				visuals.resize(canvas.rows, canvas.cols);
				visuals_glyphs = textureGlyphs(canvas.rows, canvas.cols, TexGlyphMode.GLYPHS);

				banner = textGlyphs(
					makeBanner("INDEX", "micahdb.com", canvas.cols - PADDING_COLS * 2),
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

			const panchors = content.anchors[1];

			if (portrait !== null) {
				renderer.draw(portrait_glyphs, portrait, {
					row: content_row + panchors[0].row,
					col: content_col + panchors[0].col,
					rows: portrait_glyphs.rows,
					cols: portrait_glyphs.cols
				});
			}

			terminal.blit(
				content,
				{ row: scroller.row - BANNER_ROWS, col: 0, rows: content_rows, cols: content.cols },
				{ row: 0, col: content_col, rows: content_rows, cols: content.cols }
			);

			const lanchors = content.anchors[0];

			for (let i = 0; i < lanchors.length && i < links.length; i++) {
				const { row, col } = lanchors[i] as { row: number; col: number };
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

			const sanchors = content.anchors[9];

			for (let i = 0; i < sanchors.length && i < sections.length; i++) {
				const { row, col } = sanchors[i] as { row: number; col: number };
				const anchor_row = content_row + row;
				const anchor_col = content_col + col;

				if (anchor_row < PADDING_ROWS || anchor_row >= canvas.rows - PADDING_ROWS * 2) {
					continue;
				}

				const section = sections[i];
				section.update(anchor_row, anchor_col);

				terminal.blit(
					section.glyphs,
					{ row: 0, col: 0, rows: 1, cols: section.glyphs.cols },
					{ row: anchor_row, col: anchor_col, rows: 1, cols: section.glyphs.cols }
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

			if (canvas.class_name !== document.body.className) {
				document.body.className = canvas.class_name;
			}

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
