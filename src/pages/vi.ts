import { loadTexture } from "@micahdb/tscon";

import { Vi } from "@/vi/vi.ts";

import CONTENT from "./content/VI" with { type: "text" };

export function vi_page() {
	const canvas_el = document.getElementById("webgl") as HTMLCanvasElement;

	try {
		// the content file carries a title and separator for the static
		// fallback; the document is everything below them
		const raw = CONTENT as string;
		const first_nl = raw.indexOf("\n");
		const second_nl = first_nl + 1 + raw.slice(first_nl + 1, -1).indexOf("\n");
		const content = raw.slice(second_nl + 1, -1);

		new Vi({
			canvas_el,
			content,
			filename: "VI",
			font_path: "/images/font.png",
			textures: {
				portrait: (gl) => loadTexture(gl, "/images/portrait.jpeg"),
			},
		});
	} catch (err) {
		console.error(err);
	}
}
