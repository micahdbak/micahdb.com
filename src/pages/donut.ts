import * as tscon from "@micahdb/tscon";
import { PALETTE } from "@/palette.ts";

import { TorusVisuals } from "@/visuals/torus.ts";

export function donut() {
	const canvas_el = document.getElementById("webgl") as HTMLCanvasElement;
	const canvas = tscon.Canvas.from(canvas_el, { palette: PALETTE, stretch: true });

	const terminal = new tscon.Terminal(canvas);
	const renderer = new tscon.Renderer(canvas);

	let font: WebGLTexture | null = null;
	const load_font = async () => {
		font = await tscon.loadTexture(canvas.gl, "/images/font.png");
	};
	void load_font();

	const torus = new TorusVisuals(canvas);
	void torus.init();

	let tglyphs = tscon.textureGlyphs(canvas.rows, canvas.cols, tscon.TexGlyphMode.BG_GLYPHS);
	torus.resize(canvas.rows, canvas.cols);

	let resized = false;
	canvas.addEventListener("resize", () => {
		resized = true;
	});

	const loop = () => {
		if (canvas.rows < 8 || canvas.cols < 16) {
			canvas.clear();
			terminal.clear();
			terminal.draw();
			requestAnimationFrame(loop);
			return;
		}

		if (resized) {
			resized = false;
			tglyphs = tscon.textureGlyphs(canvas.rows, canvas.cols, tscon.TexGlyphMode.BG_GLYPHS);
			torus.resize(canvas.rows, canvas.cols);
		}

		if (font !== null && canvas.user_font === null) {
			canvas.user_font = font;
			terminal.use_user_font = true;
			renderer.use_user_font = true;
		}

		canvas.clear();

		torus.render();
		const trect = { row: 0, col: 0, rows: tglyphs.rows, cols: tglyphs.cols };
		renderer.draw(tglyphs, torus.render_target, trect);

		terminal.clear();
		terminal.draw();

		canvas.mouse_click = false;
		requestAnimationFrame(loop);
	};
	loop();
}
