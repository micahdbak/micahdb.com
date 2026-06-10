// src/glyphatlas.ts
var main = async () => {
  const canvas = document.getElementById("2d");
  const ctx = canvas.getContext("2d");
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
  const metrics = ctx.measureText("█");
  const glyphWidth = Math.ceil(metrics.width);
  const ascent = Math.ceil(metrics.fontBoundingBoxAscent);
  const descent = Math.ceil(metrics.fontBoundingBoxDescent);
  const glyphHeight = ascent + descent;
  const padding = 8;
  console.log(`Glyph width: ${glyphWidth}, height: ${glyphHeight}`);
  const nHorizGlyphs = Math.floor(4096 / (glyphWidth + padding));
  const drawGlyph = (char, i2) => {
    const cellX = i2 % nHorizGlyphs * (glyphWidth + padding);
    const cellY = Math.floor(i2 / nHorizGlyphs) * (glyphHeight + padding);
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
    for (let c = 33;c <= 126; c++) {
      drawGlyph(String.fromCharCode(c), i);
      i++;
    }
  }
  ctx.font = font;
  for (let c = 9472;c <= 9631; c++) {
    drawGlyph(String.fromCharCode(c), i);
    i++;
  }
};
await main();
