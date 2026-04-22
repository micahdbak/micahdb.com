const main = () => {
	const canvas = document.getElementById("2d") as HTMLCanvasElement;
	const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

	ctx.font = "256px 'JetBrains Mono', monospace";
	const metrics: TextMetrics = ctx.measureText("M");

	const glyphWidth: number = Math.ceil(metrics.width);
	const glyphHeight: number = Math.ceil(
		metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent
	);
	console.log(`Glyph width: ${glyphWidth}, height: ${glyphHeight}`);

	// ASCII table:
	// - <33 -> space and non renderable characters
	// - 33 -> !
	// - 126 -> ~
	// - >126 -> extended characters
	const glyphStart = 33;
	const glyphEnd = 126;

	const glyphsWidth = glyphWidth * (glyphEnd - glyphStart + 1);
	const glyphsHeight = glyphHeight;

	let canvasWidth = 2;
	let canvasHeight = 2;

	// for WebGL 1.0 mip maps, the canvas width/height must be powers of 2

	while (canvasWidth < glyphsWidth) {
		canvasWidth *= 2;
	}

	while (canvasHeight < glyphsHeight) {
		canvasHeight *= 2;
	}

	canvas.width = canvasWidth;
	canvas.height = canvasHeight;

	ctx.font = "256px 'JetBrains Mono', monospace"; // need to reset
	ctx.fillStyle = "white";

	for (let c = glyphStart; c <= glyphEnd; c++) {
		const x = glyphWidth * (c - glyphStart);
		ctx.fillText(String.fromCharCode(c), x, 256);
	}
};

main();
