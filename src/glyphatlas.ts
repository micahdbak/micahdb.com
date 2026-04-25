const main = async () => {
	const canvas = document.getElementById("2d") as HTMLCanvasElement;
	const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
	const font = "160px 'JetBrains Mono', monospace";

	canvas.width = 4096;
	canvas.height = 4096;

	await Promise.all([
		document.fonts.load("160px 'JetBrains Mono'"),
		document.fonts.load("bold 160px 'JetBrains Mono'"),
		document.fonts.load("italic 160px 'JetBrains Mono'"),
		document.fonts.load("italic bold 160px 'JetBrains Mono'")
	]);
	ctx.font = font;
	ctx.fillStyle = "white";

	const metrics: TextMetrics = ctx.measureText("█");
	const glyphWidth: number = Math.ceil(metrics.width);
	const ascent: number = Math.ceil(metrics.fontBoundingBoxAscent);
	const descent: number = Math.ceil(metrics.fontBoundingBoxDescent);
	const glyphHeight: number = ascent + descent;
	const padding = 8;

	console.log(`Glyph width: ${glyphWidth}, height: ${glyphHeight}`);

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

	const styles = ["", "bold ", "italic ", "italic bold "];

	for (const style of styles) {
		ctx.font = style + font;

		// ASCII table:
		// - <33 -> space and non renderable characters
		// - 33 -> !
		// - 126 -> ~
		// - >126 -> extended characters
		for (let c = 33; c <= 126; c++) {
			drawGlyph(String.fromCharCode(c), i);
			i++;
		}
	}

	ctx.font = font;

	// Box drawing characters:
	// - 0x2500...0x259f
	for (let c = 0x2500; c <= 0x259f; c++) {
		drawGlyph(String.fromCharCode(c), i);
		i++;
	}
};

await main();
