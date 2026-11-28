import * as tscon from "@micahdb/tscon";
import { main } from "./pages/main.ts";
import { donut } from "./pages/donut.ts";
import { tscon_page } from "./pages/tscon.ts";
import { vi_page } from "./pages/vi.ts";

// cp437.html
async function render() {
	const canvas = document.getElementById("atlas") as HTMLCanvasElement;
	const font = "160px 'JetBrains Mono'";
	await tscon.renderCp437(canvas, font);
}

if (window.location.pathname === "/cp437.html") {
	await render();
} else {
	switch (window.location.pathname) {
		case "/donut.html":
			donut();
			break;
		case "/vi.html":
			vi_page();
			break;
		case "/tscon.html":
			tscon_page();
			break;
		default:
			main();
			break;
	}
}
