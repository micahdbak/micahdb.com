import { Renderer } from "./renderer.js";

const main = () => {
	const canvas = document.getElementById("webgl") as HTMLCanvasElement;

	try {
		const renderer = new Renderer(canvas);
		let mouseX = 128,
			mouseY = 128;

		const f = () => {
			renderer.setVertices(
				new Float32Array([
					mouseX - 64,
					mouseY + 32,
					mouseX + 64,
					mouseY + 32,
					mouseX,
					mouseY - 48
				])
			);
			renderer.setColours(new Float32Array([0, 0, 1, 0, 1, 0, 1, 0, 0]));
			renderer.draw();
			requestAnimationFrame(f);
		};

		requestAnimationFrame(f);

		window.addEventListener("resize", () => {
			renderer.updateProjectionMatrix();
		});

		window.addEventListener("pointermove", (e) => {
			mouseX = 2 * e.clientX;
			mouseY = 2 * e.clientY;
		});
	} catch (err: Error) {
		console.error(err);
	}
};

main();
