import { Colour } from "./colour.ts";

export class Glyph {
	static readonly WIDTH = 96;
	static readonly HEIGHT = 211;
	static readonly WTOH_RATIO = Glyph.HEIGHT / Glyph.WIDTH;
	static readonly VERTICES = 6;

	static readonly ASCII_START = 33;
	static readonly ASCII_END = 126;
	static readonly ASCII_COUNT = Glyph.ASCII_END - Glyph.ASCII_START + 1;

	static readonly NORMAL_FONT = 0;
	static readonly BOLD_FONT = 1 * Glyph.ASCII_COUNT;
	static readonly ITALIC_FONT = 2 * Glyph.ASCII_COUNT;
	static readonly ITALIC_BOLD_FONT = 3 * Glyph.ASCII_COUNT;

	public bgColour: Colour;
	public fgColour: Colour;
	public charCode: number;

	constructor(
		public bgColour: Colour,
		public fgColour: Colour,
		public charCode: number
	) {
		this.bgColour = bgColour;
		this.fgColour = fgColour;
		this.charCode = charCode;
	}

	data(): Uint32Array {
		// Uint32 containing bgColour (1 byte), fgColour (1 byte), charCode (2 bytes)
		const packed =
			(this.bgColour & 0xff) |
			((this.fgColour & 0xff) << 8) |
			((this.charCode & 0xffff) << 16);
		return new Uint32Array(Glyph.VERTICES).fill(packed);
	}

	static fromData(data: Uint32Array): Glyph {
		const packed = data[0];
		return new Glyph(
			packed & 0xff,
			(packed >> 8) & 0xff,
			(packed >> 16) & 0xffff
		);
	}
}
