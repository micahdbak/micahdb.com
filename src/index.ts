import { main } from "./pages/main.ts";
import { renderCp437 } from "./cp437.ts";

// cp437.html
async function render() {
	const canvas = document.getElementById("2d") as HTMLCanvasElement;
	const font = "160px 'JetBrains Mono'";
	await renderCp437(canvas, font);
}

if (window.location.pathname === "/cp437.html") {
	await render();
} else {
	main();
}
