import { Renderer } from "./renderer.js";

const main = async () => {
	const canvas = document.getElementById("webgl") as HTMLCanvasElement;

	try {
		const renderer = new Renderer(canvas);
		await renderer.init();

		let mouseX = 128,
			mouseY = 128;

		const f = () => {
			const ratio = renderer.glyphHeight / renderer.glyphWidth;
			const w = 32;
			const h = 32 * ratio;
			const uMax = renderer.glyphWidth / renderer.glyphAtlasWidth;
			const vMax = renderer.glyphHeight / renderer.glyphAtlasHeight;

			const vTL = [mouseX - w / 2, mouseY - h, 0.5, 0.5, 0.5, 1, 1, 1, 0, 0];
			const vBL = [mouseX - w / 2, mouseY, 0.5, 0.5, 0.5, 1, 1, 1, 0, vMax];
			const vTR = [mouseX + w / 2, mouseY - h, 0.5, 0.5, 0.5, 1, 1, 1, uMax, 0];
			const vBR = [mouseX + w / 2, mouseY, 0.5, 0.5, 0.5, 1, 1, 1, uMax, vMax];

			renderer.setData(
				new Float32Array([...vTL, ...vBL, ...vTR, ...vTR, ...vBL, ...vBR])
			);
			renderer.draw();
			requestAnimationFrame(f);
		};

		requestAnimationFrame(f);

		window.addEventListener("resize", () => {
			renderer.updateProjectionMatrix();
		});

		window.addEventListener("pointermove", (e) => {
			const dpr = window.devicePixelRatio || 1;
			mouseX = dpr * e.clientX;
			mouseY = dpr * e.clientY;
		});
	} catch (err: Error) {
		console.error(err);
	}
};

await main();
