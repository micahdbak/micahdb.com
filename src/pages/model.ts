import { Canvas, Terminal, Renderer, TexGlyphMode, textureGlyphs, textGlyphs, loadTexture } from "@micahdb/tscon";
import type { Anchor, Glyphs } from "@micahdb/tscon";

import { ModelVisuals } from "@/visuals/model.ts";
import { Link } from "@/components/link.ts";

const MODEL_ROWS = 24;
const MODEL_COLS = 48;

const INFO = `\\f6micah@micahdb.com\\f7
\\f6----------------\\f7

\\f6Role:\\f7       Software Developer
\\f6Location:\\f7   Vancouver, BC, Canada
\\f6Education:\\f7  BSc Computing Science
\\f6Work:\\f7       Open WebUI (Svelte, FastAPI)
\\f6Focus:\\f7      Systems, Databases, Graphics

\\f6E-mail:\\f7     \\a0{micah_baker@sfu.ca|mailto:micah_baker@sfu.ca}micah_baker@sfu.ca
\\f6GitHub:\\f7     \\a0{github.com/micahdbak|https://github.com/micahdbak}github.com/micahdbak
\\f6LinkedIn:\\f7   \\a0{linkedin.com/in/micahdbak|https://linkedin.com/in/micahdbak}linkedin.com/in/micahdbak`;

interface Layout {
	row_offset: number;
	col_offset: number;
	text_row: number;
	text_col: number;
}

export function model() {
	const canvas_el = document.getElementById("webgl") as HTMLCanvasElement;

	try {
		// initialize

		const canvas = new Canvas(canvas_el);
		const terminal = new Terminal(canvas);
		const renderer = new Renderer(canvas);

		// font

		let font: WebGLTexture | null = null;

		const load_font = async () => {
			font = await loadTexture(canvas.gl, "/images/font.png");
		};
		void load_font();

		// visuals

		const visuals = new ModelVisuals(
			canvas,
			"/meshes/model.glb",
			"/images/model/texture.png",
			"/images/normal.png",
			"/images/model/roughness.png"
		);
		void visuals.init();

		const visuals_glyphs = textureGlyphs(MODEL_ROWS, MODEL_COLS, TexGlyphMode.SAMPLE);
		visuals.resize(MODEL_ROWS, MODEL_COLS);

		// info text

		const TEXT_COLS = 40;

		let content: Glyphs = textGlyphs(INFO, TEXT_COLS, true);

		const build_links = (content: Glyphs): Link[] => {
			const links: Link[] = [];

			const link_anchors = content.anchors[0] ?? [];

			for (let i = 0; i < link_anchors.length; i++) {
				const anchor = link_anchors[i] as Anchor;

				// \a0{Link Text|https://example.com}Link_Text
				const [text = "", url = text] = (anchor.options || "Missing Link|#").split("|");

				links.push(new Link(terminal, text, url));
			}

			return links;
		};

		let links = build_links(content);

		const compute_layout = (): Layout => {
			const vertical = canvas.cols < 2 * canvas.rows;

			let text_row: number;
			let text_col: number;

			if (vertical) {
				const fits = MODEL_ROWS + 2 + content.rows <= canvas.rows;
				text_row = fits ? MODEL_ROWS + 2 : Math.max(0, canvas.rows - content.rows - 1);
				text_col = Math.max(0, Math.floor((MODEL_COLS - content.cols) / 2));
			} else {
				const fits = MODEL_COLS + 2 + TEXT_COLS <= canvas.cols;
				text_row = Math.max(0, Math.floor((MODEL_ROWS - content.rows) / 2));
				text_col = fits ? MODEL_COLS + 2 : Math.max(0, canvas.cols - TEXT_COLS - 2);
			}

			const combo_rows = Math.max(MODEL_ROWS, text_row + content.rows);
			const combo_cols = Math.max(MODEL_COLS, text_col + content.cols);

			return {
				row_offset: Math.max(0, Math.floor((canvas.rows - combo_rows) / 2)),
				col_offset: Math.max(0, Math.floor((canvas.cols - combo_cols) / 2)),
				text_row,
				text_col
			};
		};

		let layout = compute_layout();

		// main draw loop

		let resized = false;

		canvas.addEventListener("resize", () => {
			resized = true;
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

				layout = compute_layout();
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
				row: layout.row_offset,
				col: layout.col_offset,
				rows: MODEL_ROWS,
				cols: MODEL_COLS
			});

			// content

			terminal.clear();

			terminal.blit(
				content,
				{ row: 0, col: 0, rows: content.rows, cols: content.cols },
				{
					row: layout.text_row + layout.row_offset,
					col: layout.text_col + layout.col_offset,
					rows: content.rows,
					cols: content.cols
				}
			);

			const link_anchors = content.anchors[0] ?? [];

			for (let i = 0; i < links.length; i++) {
				const anchor = link_anchors[i];
				if (!anchor) {
					break;
				}

				const row = anchor.row + layout.text_row + layout.row_offset;
				const col = anchor.col + layout.text_col + layout.col_offset;
				if (row < 0 || row >= canvas.rows) {
					continue;
				}

				const glyphs = links[i]!.update(row, col);
				terminal.blit(
					glyphs,
					{ row: 0, col: 0, rows: 1, cols: glyphs.cols },
					{ row, col, rows: 1, cols: glyphs.cols }
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
	} catch (err) {
		console.error(err);
	}
}
