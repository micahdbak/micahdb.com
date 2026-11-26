import * as tscon from "@micahdb/tscon";

import { PALETTE } from "@/palette.ts";
import { Link } from "@/link.ts";
import { TorusVisuals } from "@/visuals/torus.ts";

import CONTENT from "./content/INDEX" with { type: "text" };

export function main() {
	const canvas_el = document.getElementById("webgl") as HTMLCanvasElement;
	const canvas = tscon.Canvas.from(canvas_el, { palette: PALETTE });
	const terminal = new tscon.Terminal(canvas);
	const renderer = new tscon.Renderer(canvas);

	const raw = CONTENT as string;
	const first_nl = raw.indexOf("\n");
	const second_nl = first_nl + 1 + raw.slice(first_nl + 1, -1).indexOf("\n");
	const content = raw.slice(second_nl + 1, -1);

	const glyphs = new tscon.Glyphs(content, 40, { wrap: tscon.Wrap.TRUNCATE });
	const links = Link.parse(glyphs);

	const torus = new TorusVisuals(canvas);
	void torus.init();

	const trows = 16;
	const tcols = 32;
	const tglyphs = tscon.textureGlyphs(trows, tcols, tscon.TexGlyphMode.BG_GLYPHS);
	torus.resize(trows, tcols);

	const loop = () => {
		canvas.clear();

		torus.render();
		const trect = { row: 0, col: 0, rows: trows, cols: tcols };
		renderer.draw(tglyphs, torus.render_target, trect);

		terminal.clear();

		const drawAndRequest = () => {
			canvas.mouse_click = false;
			terminal.draw();

			if (canvas.class_name !== document.body.className) {
				document.body.className = canvas.class_name;
			}

			requestAnimationFrame(loop);
		};

		const row_offset = Math.max(trows <= glyphs.rows ? 0 : Math.floor((trows - glyphs.rows) / 2), 1);

		const vertical = canvas.cols < 0 + tcols + glyphs.cols;
		const row = vertical ? trows : row_offset;
		const col = vertical ? 2 : tcols;

		const rows = Math.max(0, Math.min(glyphs.rows, canvas.rows - row));
		const cols = Math.max(0, Math.min(glyphs.cols, canvas.cols - col));
		if (rows === 0 || cols === 0) {
			drawAndRequest();
			return;
		}

		const src = { row: 0, col: 0, rows, cols };
		const dst = { row, col, rows, cols };
		terminal.blit(glyphs, src, dst);

		for (const link of links) {
			link.draw(terminal, glyphs, { row, col }, dst);
		}

		drawAndRequest();
	};
	loop();
}
