import * as tscon from "@micahdb/tscon";

/** The normalised `[R, G, B]` of one palette entry, as the canvas holds it. */
export function paletteColour(
	canvas: tscon.Canvas,
	colour: tscon.Colour
): readonly [number, number, number] {
	const offset = colour * 3;
	const palette = canvas.palette;

	return [palette[offset]!, palette[offset + 1]!, palette[offset + 2]!];
}

/**
 * The site's terminal palette, taken from the `vague` Neovim colourscheme.
 *
 * The sixteen entries follow the scheme's `:terminal` colours, except
 * {@link tscon.Colour.BLACK}, which is the frame background and so uses the
 * scheme's editor background rather than its `line` colour.
 */
export const PALETTE = new tscon.Palette([
	[0x14, 0x14, 0x15], // Colour.BLACK         bg
	[0xd8, 0x64, 0x7e], // Colour.RED           error
	[0x7f, 0xa5, 0x63], // Colour.GREEN         plus
	[0xf3, 0xbe, 0x7c], // Colour.ORANGE        warning
	[0x6e, 0x94, 0xb2], // Colour.BLUE          keyword
	[0xbb, 0x9d, 0xbd], // Colour.MAGENTA       parameter
	[0xae, 0xae, 0xd1], // Colour.CYAN          constant
	[0xcd, 0xcd, 0xcd], // Colour.GREY          fg
	[0x60, 0x60, 0x79], // Colour.BRIGHT_BLACK  comment
	[0xe0, 0x83, 0x98], // Colour.BRIGHT_RED
	[0x99, 0xb7, 0x82], // Colour.BRIGHT_GREEN
	[0xf5, 0xcb, 0x96], // Colour.YELLOW
	[0x8b, 0xa9, 0xc1], // Colour.BRIGHT_BLUE
	[0xc9, 0xb1, 0xca], // Colour.BRIGHT_MAGENTA
	[0xbe, 0xbe, 0xda], // Colour.BRIGHT_CYAN
	[0xd7, 0xd7, 0xd7], // Colour.WHITE
]);
