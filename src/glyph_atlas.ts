async function main() {
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
	const glyph_width: number = Math.ceil(metrics.width);
	const ascent: number = Math.ceil(metrics.fontBoundingBoxAscent);
	const descent: number = Math.ceil(metrics.fontBoundingBoxDescent);
	const glyph_height: number = ascent + descent;
	const padding = 8;

	console.log(`Glyph width: ${glyph_width}, height: ${glyph_height}`);

	const cols = Math.floor(4096 / (glyph_width + padding));

	function drawGlyph(char: string, i: number) {
		const cell_x = (i % cols) * (glyph_width + padding);
		const cell_y = Math.floor(i / cols) * (glyph_height + padding);

		ctx.save();
		ctx.beginPath();
		ctx.rect(cell_x, cell_y, glyph_width, glyph_height);
		ctx.clip();
		ctx.fillText(char, cell_x, cell_y + ascent);
		ctx.restore();
	}

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
}

await main();
