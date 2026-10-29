import * as tscon from "@micahdb/tscon";
import { TorusVisuals } from "@/visuals/torus.ts";

import { Pager } from "@/components/pager.ts";
import { Link } from "@/components/link.ts";
import { Section } from "@/components/section.ts";

import CONTENT from "./content/INDEX" with { type: "text" };

const PADDING_ROWS = 1;
const PADDING_COLS = 2;
const TRAILING_ROWS = 4;

export function main() {
	const canvas_el = document.getElementById("webgl") as HTMLCanvasElement;

	try {
		// initialize

		const canvas = new tscon.Canvas(canvas_el);
		const terminal = new tscon.Terminal(canvas);
		const renderer = new tscon.Renderer(canvas);

		// font

		let font: WebGLTexture | null = null;

		const load_font = async () => {
			font = await tscon.loadTexture(canvas.gl, "/images/font.png");
		};
		void load_font();

		// visuals

		const visuals = new TorusVisuals(canvas);
		void visuals.init();

		let visuals_glyphs = tscon.textureGlyphs(canvas.rows, canvas.cols, tscon.TexGlyphMode.GLYPHS);
		visuals.resize(canvas.rows, canvas.cols);

		// pager

		const pager = new Pager(terminal);

		// content

		// portrait
		let portrait: WebGLTexture | null = null;
		const portrait_glyphs = tscon.textureGlyphs(4, 8, tscon.TexGlyphMode.SAMPLE);

		const load_portrait = async () => {
			portrait = await tscon.loadTexture(canvas.gl, "/images/portrait.jpeg");
		};
		void load_portrait();

		// actual content
		let content_str = CONTENT as string;
		const first_nl = content_str.indexOf("\n");
		const second_nl = first_nl + 1 + content_str.slice(first_nl + 1, -1).indexOf("\n");
		content_str = content_str.slice(second_nl + 1, -1);

		const content_cols = Math.min(80, canvas.cols - PADDING_COLS * 2);
		let content = new tscon.Glyphs(content_str, content_cols);

		// links
		const links: Link[] = [];

		const link_anchors = content.anchors[0] ?? [];

		for (let i = 0; i < link_anchors.length; i++) {
			const anchor = link_anchors[i] as tscon.Anchor;

			// \a0{Link Text|https://example.com}Link_Text
			const [text = "", url = text] = (anchor.options || "Missing Link|#").split("|");

			links.push(new Link(terminal, text, url));
		}

		// sections
		const sections: Section[] = [];

		const section_anchors = content.anchors[9] ?? [];

		for (let i = 0; i < section_anchors.length; i++) {
			const anchor = section_anchors[i] as tscon.Anchor;

			// \a0{Section Text|#section_hash}Section_Text
			const [text = "", hash = "#"] = (anchor.options || "Missing Section").split("|");

			sections.push(new Section(terminal, text, hash));
		}

		// top button

		const to_top = new Link(terminal, " [ Go to Top ] ", "#top");

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

			const total_rows = content.rows + TRAILING_ROWS;

			if (hash === "#top") {
				pager.scrollToRow(0, total_rows);
				window.location.hash = "";
				return;
			}

			const i = sections.findIndex((section) => section.hash === hash);

			if (i >= 0) {
				pager.scrollToRow(content.anchors[9]![i]!.row - PADDING_ROWS, total_rows);
			}
		}

		// scroll to anchor on load
		scrollToSection(window.location.hash);

		// scroll to anchor when the hash changes (e.g. clicking a TOC link)
		window.addEventListener("hashchange", () => {
			scrollToSection(window.location.hash);
		});

		const draw = () => {
			// too small to render; just clear and return
			if (canvas.rows < 8 || canvas.cols < 16) {
				canvas.clear();
				terminal.clear();
				terminal.draw();
				requestAnimationFrame(draw);
				return;
			}

			if (resized) {
				resized = false;

				visuals_glyphs = tscon.textureGlyphs(canvas.rows, canvas.cols, tscon.TexGlyphMode.GLYPHS);
				visuals.resize(canvas.rows, canvas.cols);

				const content_cols = Math.min(80, canvas.cols - PADDING_COLS * 2);
				content = new tscon.Glyphs(content_str, content_cols);
			}

			if (font !== null && canvas.user_font === null) {
				canvas.user_font = font;
				terminal.use_user_font = true;
				renderer.use_user_font = true;
			}

			canvas.clear();

			// visuals

			visuals.render();
			renderer.draw(visuals_glyphs, visuals.render_target, {
				row: 0,
				col: 0,
				rows: visuals_glyphs.rows,
				cols: visuals_glyphs.cols
			});

			// content

			terminal.clear();

			const total_rows = content.rows + TRAILING_ROWS;

			pager.update(total_rows);

			const content_row = -pager.row;
			const content_col = PADDING_COLS;
			const content_rows = Math.min(canvas.rows, content.rows - pager.row);

			terminal.blit(
				content,
				{ row: pager.row, col: 0, rows: content_rows, cols: content.cols },
				{ row: 0, col: content_col, rows: content_rows, cols: content.cols }
			);

			// links

			const link_anchors = content.anchors[0] ?? [];

			for (const [i, link] of links.entries()) {
				if (i >= link_anchors.length) {
					break;
				}

				const { row, col } = link_anchors[i] as tscon.Anchor;
				const anchor_row = content_row + row;
				const anchor_col = content_col + col;

				if (anchor_row < PADDING_ROWS || anchor_row >= canvas.rows - PADDING_ROWS) {
					continue;
				}

				const glyphs = link.update(anchor_row, anchor_col);

				terminal.blit(
					glyphs,
					{ row: 0, col: 0, rows: 1, cols: glyphs.cols },
					{ row: anchor_row, col: anchor_col, rows: 1, cols: glyphs.cols }
				);
			}

			// sections

			const section_anchors = content.anchors[9] ?? [];

			for (const [i, section] of sections.entries()) {
				if (i >= section_anchors.length) {
					break;
				}

				const { row, col } = section_anchors[i] as tscon.Anchor;
				const anchor_row = content_row + row;
				const anchor_col = content_col + col;

				if (anchor_row < 0 || anchor_row >= canvas.rows) {
					continue;
				}

				const glyphs = section.update(anchor_row, anchor_col);

				terminal.blit(
					glyphs,
					{ row: 0, col: 0, rows: 1, cols: glyphs.cols },
					{ row: anchor_row, col: anchor_col, rows: 1, cols: glyphs.cols }
				);
			}

			// bottom row / status row / to top button
			if (total_rows > canvas.rows) {
				if (pager.row > 0) {
					const row = 0;
					const col = canvas.cols - to_top.text.length;
					const glyphs = to_top.update(row, col);

					terminal.blit(
						glyphs,
						{ row: 0, col: 0, rows: 1, cols: glyphs.cols },
						{ row, col, rows: 1, cols: glyphs.cols }
					);
				}

				const status_row = canvas.rows - 1 - (terminal.detail_text.length > 0 ? 1 : 0);
				terminal.blit(
					pager.status_glyphs,
					{ row: 0, col: 0, rows: 1, cols: pager.status_glyphs.cols },
					{ row: status_row, col: 0, rows: 1, cols: pager.status_glyphs.cols }
				);
			}

			terminal.draw();

			// portrait

			const [first_anchor] = content.anchors[1] ?? [];

			if (portrait !== null && first_anchor) {
				renderer.draw(portrait_glyphs, portrait, {
					row: content_row + first_anchor.row,
					col: content_col + first_anchor.col,
					rows: portrait_glyphs.rows,
					cols: portrait_glyphs.cols
				});
			}

			canvas.mouse_click = false;

			if (canvas.class_name !== document.body.className) {
				document.body.className = canvas.class_name;
			}

			requestAnimationFrame(draw);
		};

		requestAnimationFrame(draw);
	} catch (err) {
		console.error(err);
	}
}
