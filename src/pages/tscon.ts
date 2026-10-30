import * as tscon from "@micahdb/tscon";
import { PALETTE } from "@/palette.ts";

import { Vi } from "@/vi/vi.ts";

import CONTENT from "./content/TSCON" with { type: "text" };

export function tscon_page() {
	const canvas_el = document.getElementById("webgl") as HTMLCanvasElement;

	try {
		const canvas = tscon.Canvas.from(canvas_el, { palette: PALETTE });
		// the content file carries a title and separator for the static
		// fallback; the document is everything below them
		const raw = CONTENT as string;
		const first_nl = raw.indexOf("\n");
		const second_nl = first_nl + 1 + raw.slice(first_nl + 1, -1).indexOf("\n");
		const content = raw.slice(second_nl + 1, -1);

		new Vi({
			canvas,
			content,
			filename: "TSCON",
			font_path: "/images/font.png",
			textures: {
				portrait: (gl) => tscon.loadTexture(gl, "/images/portrait.jpeg"),
			}
		});
	} catch (err) {
		console.error(err);
	}
}
