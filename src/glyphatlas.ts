const main = () => {
	const canvas = document.getElementById("2d") as HTMLCanvasElement;
	const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

	canvas.width = 4096;
	canvas.height = 4096;

	ctx.font = "256px 'JetBrains Mono', monospace";
	ctx.fillStyle = "white";

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

	const nHorizGlyphs = Math.floor(4096 / glyphWidth);

	ctx.fillStyle = "white";

	for (let c = glyphStart; c <= glyphEnd; c++) {
		const i = c - glyphStart;
		const x = (i % nHorizGlyphs) * glyphWidth;
		const y = 256 + Math.floor(i / nHorizGlyphs) * glyphHeight;
		ctx.fillText(String.fromCharCode(c), x, y);
	}
};

main();
