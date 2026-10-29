import * as tscon from "@micahdb/tscon";

import { TorusVisuals } from "@/visuals/torus.ts";

export function donut() {
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

		let visuals_glyphs = tscon.textureGlyphs(canvas.rows, canvas.cols, tscon.TexGlyphMode.BG_GLYPHS);
		visuals.resize(canvas.rows, canvas.cols);

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

				visuals_glyphs = tscon.textureGlyphs(canvas.rows, canvas.cols, tscon.TexGlyphMode.BG_GLYPHS);
				visuals.resize(canvas.rows, canvas.cols);
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
