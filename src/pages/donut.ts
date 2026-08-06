import { Canvas } from "@/canvas.ts";
import { Terminal } from "@/terminal.ts";
import { Renderer } from "@/renderer.ts";

import { TorusVisuals } from "@/visuals/torus.ts";

import { TexGlyphMode, textureGlyphs } from "@/glyphs.ts";

export function donut() {
	const canvas_el = document.getElementById("webgl") as HTMLCanvasElement;

	try {
		// initialize

		const canvas = new Canvas(canvas_el);
		const terminal = new Terminal(canvas);
		const renderer = new Renderer(canvas);

		// visuals

		const visuals = new TorusVisuals(canvas);
		void visuals.init();

		let visuals_glyphs = textureGlyphs(canvas.rows, canvas.cols, TexGlyphMode.BG_GLYPHS);
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

				visuals_glyphs = textureGlyphs(canvas.rows, canvas.cols, TexGlyphMode.BG_GLYPHS);
				visuals.resize(canvas.rows, canvas.cols);
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
	} catch (err: Error) {
		console.error(err);
	}
}
