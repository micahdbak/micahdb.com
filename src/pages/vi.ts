import * as tscon from "@micahdb/tscon";
import { PALETTE } from "@/palette.ts";

import { Vi } from "@/vi/vi.ts";

import CONTENT from "./content/VI" with { type: "text" };

export function vi_page() {
	const canvas_el = document.getElementById("webgl") as HTMLCanvasElement;

	try {
		const canvas = tscon.Canvas.from(canvas_el, { palette: PALETTE, stretch: true });
		canvas.focus();

		const raw = CONTENT as string;
		const first_nl = raw.indexOf("\n");
		const second_nl = first_nl + 1 + raw.slice(first_nl + 1, -1).indexOf("\n");
		const content = raw.slice(second_nl + 1, -1);

		new Vi({
			canvas,
			content,
			filename: "VI",
			font_path: "/images/font.png",
		});
	} catch (err) {
		console.error(err);
	}
}
