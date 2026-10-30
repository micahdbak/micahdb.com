import * as tscon from "@micahdb/tscon";
import { PALETTE } from "@/palette.ts";

import { Vi } from "@/vi/vi.ts";
import { ModelVisuals } from "@/visuals/model.ts";
import { TorusVisuals } from "@/visuals/torus.ts";
import type { Visuals } from "@/visuals/visuals.ts";

import CONTENT from "./content/INDEX" with { type: "text" };

// starting sizes; the editor may resize either, up to Vi's image limits
const TORUS_ROWS = 30;
const TORUS_COLS = 60;
const MODEL_ROWS = 10;
const MODEL_COLS = 20;

export function main() {
	const canvas_el = document.getElementById("webgl") as HTMLCanvasElement;

	try {
		const canvas = tscon.Canvas.from(canvas_el, { palette: PALETTE });

		// both visuals render into their own render targets every frame;
		// the document's image anchors sample them photographically
		const model = new ModelVisuals(
			canvas,
			"/meshes/model.glb",
			"/images/model/texture.png",
			"/images/normal.png",
			"/images/model/roughness.png"
		);
		void model.init();
		model.resize(MODEL_ROWS, MODEL_COLS);

		const torus = new TorusVisuals(canvas);
		void torus.init();
		torus.resize(TORUS_ROWS, TORUS_COLS);

		// the document can resize either region, so follow its anchors
		const visuals: Record<string, Visuals> = { model, torus };
		const sizes = new Map<string, string>([
			["model", `${MODEL_ROWS}x${MODEL_COLS}`],
			["torus", `${TORUS_ROWS}x${TORUS_COLS}`],
		]);

		let vi: Vi | null = null;

		const follow_sizes = (): void => {
			for (const region of vi?.imageRegions() ?? []) {
				const size = `${region.rows}x${region.cols}`;

				if (sizes.get(region.name) === size) {
					continue;
				}

				sizes.set(region.name, size);
				visuals[region.name]?.resize(region.rows, region.cols);
			}
		};

		// the content file carries a title and separator for the static
		// fallback; the document is everything below them
		const raw = CONTENT as string;
		const first_nl = raw.indexOf("\n");
		const second_nl = first_nl + 1 + raw.slice(first_nl + 1, -1).indexOf("\n");
		const content = raw.slice(second_nl + 1, -1);

		vi = new Vi({
			canvas,
			content,
			filename: "INDEX",
			font_path: "/images/font.png",
			textures: {
				model: model.render_target,
				torus: torus.render_target,
			},
			image_modes: {
				torus: tscon.TexGlyphMode.GLYPHS,
			},
			before_frame: () => {
				follow_sizes();
				model.render();
				torus.render();
			},
		});
	} catch (err) {
		console.error(err);
	}
}
