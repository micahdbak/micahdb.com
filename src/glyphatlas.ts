const main = () => {
	const canvas = document.getElementById("2d") as HTMLCanvasElement;
	const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

	canvas.width = 4096;
	canvas.height = 4096;

	ctx.font = "160px 'JetBrains Mono', monospace";
	ctx.fillStyle = "white";

	const metrics: TextMetrics = ctx.measureText("█");
	const glyphWidth: number = Math.ceil(metrics.width);
	const glyphHeight: number = Math.ceil(
		metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent
	);
	const padding = 8;

	console.log(`Glyph width: ${glyphWidth}, height: ${glyphHeight}`);

	// ASCII table:
	// - <33 -> space and non renderable characters
	// - 33 -> !
	// - 126 -> ~
	// - >126 -> extended characters
	// Box drawing characters:
	// - 0x2500...0x259f
	const ranges = [
		[33, 126],
		[0x2500, 0x259f]
	];

	const nHorizGlyphs = Math.floor(4096 / (glyphWidth + padding));

	let i = 1;
	for (const [start, end] of ranges) {
		for (let c = start; c <= end; c++) {
			const x = (i % nHorizGlyphs) * (glyphWidth + padding);
			const y = 160 + Math.floor(i / nHorizGlyphs) * (glyphHeight + padding);
			ctx.fillText(String.fromCharCode(c), x, y);
			i++;
		}
	}
};

main();
