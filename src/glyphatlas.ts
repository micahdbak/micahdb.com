const main = async () => {
	const canvas = document.getElementById("2d") as HTMLCanvasElement;
	const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

	canvas.width = 4096;
	canvas.height = 4096;

	await document.fonts.load("160px 'JetBrains Mono'");
	ctx.font = "160px 'JetBrains Mono', monospace";
	ctx.fillStyle = "white";

	const metrics: TextMetrics = ctx.measureText("█");
	const glyphWidth: number = Math.ceil(metrics.width);
	const ascent: number = Math.ceil(metrics.fontBoundingBoxAscent);
	const descent: number = Math.ceil(metrics.fontBoundingBoxDescent);
	const glyphHeight: number = ascent + descent;
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

	const drawGlyph = (char: string, i: number) => {
		const cellX = (i % nHorizGlyphs) * (glyphWidth + padding);
		const cellY = Math.floor(i / nHorizGlyphs) * (glyphHeight + padding);

		ctx.save();
		ctx.beginPath();
		ctx.rect(cellX, cellY, glyphWidth, glyphHeight);
		ctx.clip();
		ctx.fillText(char, cellX, cellY + ascent);
		ctx.restore();
	};

	let i = 1;
	for (const [start, end] of ranges) {
		for (let c = start; c <= end; c++) {
			drawGlyph(String.fromCharCode(c), i);
			i++;
		}
	}
};

await main();
