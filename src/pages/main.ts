import { Canvas } from "@/canvas.ts";
import { Terminal } from "@/terminal.ts";
import { Renderer } from "@/renderer.ts";

//import { EarthVisuals } from "@/visuals/earth.ts";
//import { CubeVisuals } from "@/visuals/cube.ts";
//import { NebulaeVisuals } from "@/visuals/nebulae.ts";
import { TorusVisuals } from "@/visuals/torus.ts";

import { Anchor, textGlyphs } from "@/glyphs.ts";
import { TexGlyphMode, textureGlyphs } from "@/glyphs.ts";

import { loadTexture } from "@/texture.ts";

import { Pager } from "@/components/pager.ts";
import { Link } from "@/components/link.ts";
import { Section } from "@/components/section.ts";
import { BANNER_ROW, BANNER_ROWS, makeBanner } from "@/components/banner.ts";

import CONTENT from "./content/INDEX" with { type: "text" };

const PADDING_ROWS = 1;
const PADDING_COLS = 2;

export function main() {
	const canvas_el = document.getElementById("webgl") as HTMLCanvasElement;

	try {
		// initialize

		const canvas = new Canvas(canvas_el);
		const terminal = new Terminal(canvas);
		const renderer = new Renderer(canvas);

		// visuals

		const visuals = new TorusVisuals(canvas);
		void visuals.init();

		let torus_size = Math.ceil(Math.min(canvas.rows, canvas.cols / 2) / 4);
		let visuals_glyphs = textureGlyphs(torus_size, torus_size * 2, TexGlyphMode.SAMPLE);
		visuals.resize(torus_size, torus_size * 2);

		// pager

		const pager = new Pager(terminal);

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

		// actual content
		let content = textGlyphs(CONTENT as string, canvas.cols - PADDING_COLS * 2, true);

		// links
		const links: Link[] = [];

		for (let i = 0; i < content.anchors[0].length; i++) {
			const anchor = content.anchors[0][i] as Anchor;

			// \a0{Link Text|https://example.com}Link_Text
			const split = (anchor.options || "Missing Link|#").split("|");

			const text = split[0];
			const url = split.length > 1 ? split[1] : split[0];

			links.push(new Link(terminal, text, url));
		}

		// sections
		const sections: Section[] = [];

		for (let i = 0; i < content.anchors[9].length; i++) {
			const anchor = content.anchors[9][i] as Anchor;

			// \a0{Section Text|#section_hash}Section_Text
			const split = (anchor.options || "Missing Section").split("|");

			const text = split[0];
			const hash = split.length > 1 ? split[1] : "#";

			sections.push(new Section(terminal, text, hash));
		}

		// main draw loop

		let resized = false;

		canvas.addEventListener("resize", () => {
			resized = true;
		});

		// scroll to the section matching the current location hash
		function scrollToSection(hash: string) {
			if (hash === "") {
				return;
			}

			const i = sections.findIndex((section) => section.hash === hash);

			if (i >= 0) {
				//console.log(`scrolling to section ${sections[i].hash}`);
				pager.scrollToRow(
					BANNER_ROWS + content.anchors[9][i].row - 1,
					BANNER_ROWS + content.rows + 2
				);
			}
		}

		// scroll to anchor on load
		scrollToSection(window.location.hash);

		// scroll to anchor when the hash changes (e.g. clicking a TOC link)
		window.addEventListener("hashchange", () => {
			scrollToSection(window.location.hash);
		});

		const draw = () => {
			if (resized) {
				resized = false;

				torus_size = Math.ceil(Math.min(canvas.rows, canvas.cols / 2) / 4);
				visuals_glyphs = textureGlyphs(torus_size, torus_size * 2, TexGlyphMode.SAMPLE);
				visuals.resize(torus_size, torus_size * 2);

				banner = textGlyphs(
					makeBanner("INDEX", "micahdb.com", canvas.cols - PADDING_COLS * 2),
					canvas.cols - PADDING_COLS * 2,
					false
				);
				content = textGlyphs(CONTENT as string, canvas.cols - PADDING_COLS * 2, true);
			}

			canvas.clear();

			// visuals

			const torus_row = Math.max(
				Math.min(
					canvas.mouse_row - Math.floor(visuals_glyphs.rows / 2),
					canvas.rows - visuals_glyphs.rows
				),
				0
			);
			const torus_col = Math.max(
				Math.min(
					canvas.mouse_col - Math.floor(visuals_glyphs.cols / 2),
					canvas.cols - visuals_glyphs.cols
				),
				0
			);

			visuals.render();
			renderer.draw(visuals_glyphs, visuals.texture, {
				row: torus_row,
				col: torus_col,
				rows: visuals_glyphs.rows,
				cols: visuals_glyphs.cols
			});

			// content

			terminal.clear();

			const total_rows = BANNER_ROWS + content.rows + 2;

			pager.update(total_rows);

			const content_row = BANNER_ROWS - pager.row;
			const content_col = PADDING_COLS;
			const content_rows = Math.min(
				canvas.rows - PADDING_ROWS,
				content.rows + BANNER_ROWS - pager.row
			);

			// banner

			terminal.blit(
				banner,
				{ row: 0, col: 0, rows: 1, cols: banner.cols },
				{ row: BANNER_ROW - pager.row, col: PADDING_COLS, rows: 1, cols: banner.cols }
			);

			// portrait

			const portrait_anchors = content.anchors[1];

			if (portrait !== null) {
				renderer.draw(portrait_glyphs, portrait, {
					row: content_row + portrait_anchors[0].row,
					col: content_col + portrait_anchors[0].col,
					rows: portrait_glyphs.rows,
					cols: portrait_glyphs.cols
				});
			}

			terminal.blit(
				content,
				{ row: pager.row - BANNER_ROWS, col: 0, rows: content_rows, cols: content.cols },
				{ row: 0, col: content_col, rows: content_rows, cols: content.cols }
			);

			// links

			const link_anchors = content.anchors[0];

			for (let i = 0; i < link_anchors.length && i < links.length; i++) {
				const { row, col } = link_anchors[i] as Anchor;
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

			// sections

			const section_anchors = content.anchors[9];

			for (let i = 0; i < section_anchors.length && i < sections.length; i++) {
				const { row, col } = section_anchors[i] as Anchor;
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
					pager.status_glyphs,
					{ row: 0, col: 0, rows: 1, cols: pager.status_glyphs.cols },
					{ row: status_row, col: 0, rows: 1, cols: pager.status_glyphs.cols }
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
