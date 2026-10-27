import { main } from "./pages/main.ts";
import { donut } from "./pages/donut.ts";
import { model } from "./pages/model.ts";
import { vi_page } from "./pages/vi.ts";
import { renderCp437 } from "@micahdb/tscon";

// cp437.html
async function render() {
	const canvas = document.getElementById("2d") as HTMLCanvasElement;
	const font = "160px 'JetBrains Mono'";
	await renderCp437(canvas, font);
}

if (window.location.pathname === "/cp437.html") {
	await render();
} else {
	const raw = document.getElementById("raw") as HTMLElement;
	const canvas = document.getElementById("webgl") as HTMLCanvasElement;
	const gl = canvas.getContext("webgl2") as WebGL2RenderingContext;

	if (gl) {
		raw.className = "hidden";
		canvas.className = "";
	}

	try {
		switch (window.location.pathname) {
			case "/donut.html":
				donut();
				break;
			case "/vi.html":
				vi_page();
				break;
			case "/model.html":
				model();
				break;
			default:
				main();
				break;
		}
	} catch (e) {
		console.log(e);

		raw.className = "";
		canvas.className = "hidden";
	}
}
