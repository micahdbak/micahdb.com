import { Colour } from "./colour.ts";
import { charCodeInCp437 } from "./cp437.ts";
import { Cell } from "./area_types.ts";

const TAB_WIDTH = 4;

function finalSpaceIdx(text: string, start: number): number {
	// skip remaining white space
	while (start < text.length && (text[start] === " " || text[start] === "\t")) {
		start++;
	}

	// just incase there was a newline
	if (start < text.length && text[start] === "\n") {
		start++;
	}

	// reached the end of text
	if (start >= text.length) {
		return -1;
	}

	// return index of last space
	return start - 1;
}

function textToLines(text: string, cols: number, wrap: boolean): string[] {
	const lines: string[] = [];

	if (cols <= 0) {
		return lines; // empty
	}

	let start = 0;
	let running_cols = 0;
	let last_space = -1;

	for (let i = 0; i < text.length; i++) {
		const c = text[i];

		// escape sequence
		if (c === "\\" && i + 2 < text.length && "fFbBa".includes(text[i + 1])) {
			// the following are special sequences:
			// \fX : set foreground to X, dark
			// \FX : set foreground to X, bright
			// \bX : set background to X, dark
			// \BX : set background to X, bright
			// \aX : anchor in group X; to get current row/col

			// therefore, skip the 3 char combo
			i += 2;

			continue; // i++
		}

		// newline
		if (c === "\n") {
			lines.push(text.slice(start, i).trimEnd());

			start = i + 1;
			running_cols = 0;
			last_space = -1;

			continue;
		}

		// tab
		if (c === "\t") {
			const cols_to_tab = TAB_WIDTH - (running_cols % TAB_WIDTH);

			if (running_cols + cols_to_tab > cols) {
				lines.push(text.slice(start, i).trimEnd());

				if (!wrap) {
					i = text.indexOf("\n", i + 1);
				} else {
					i = finalSpaceIdx(text, i + 1);
				}

				// end of text
				if (i < 0) {
					break;
				}

				start = i + 1;
				running_cols = 0;
				last_space = -1;
			} else {
				running_cols += cols_to_tab;
				last_space = i;
			}

			continue;
		}

		// space
		if (c === " ") {
			last_space = i;
		}

		// exceeding available width
		if (running_cols + 1 > cols) {
			// skip rest of line if not wrapping
			if (!wrap) {
				lines.push(text.slice(start, i).trimEnd());

				i = text.indexOf("\n", i + 1);

				// end of text
				if (i < 0) {
					break;
				}

				start = i + 1;
				running_cols = 0;
				last_space = -1;

				continue;
			}

			// this is a continuous word that filled the whole line
			if (last_space < 0) {
				lines.push(text.slice(start, i).trimEnd());

				start = i;
				running_cols = 0;
				i--;

				continue;
			}

			// otherwise, will break at last space

			lines.push(text.slice(start, last_space).trimEnd());

			i = finalSpaceIdx(text, last_space);
			start = i + 1;
			running_cols = 0;
			last_space = -1;

			continue;
		}

		running_cols++;
	}

	// push last line if it isn't a space
	if (start < text.length) {
		lines.push(text.slice(start));
	}

	return lines;
}

export type Glyphs = {
	data: Uint16Array;
	rows: number;
	cols: number;
	anchors: Record<number, Cell[]>;
};

export function textGlyphs(text: string, cols: number, wrap: boolean): Glyphs {
	if (cols <= 0) {
		return {
			data: new Uint16Array(),
			rows: 0,
			cols: 0
		};
	}

	const lines = textToLines(text, cols, wrap);
	const rows = lines.length;

	if (rows === 0) {
		return {
			data: new Uint16Array(),
			rows: 0,
			cols: 0
		};
	}

	const glyphs = {
		data: new Uint16Array(rows * cols),
		rows,
		cols: cols,
		anchors: {}
	};

	let fg: number = Colour.WHITE;
	let bg: number = Colour.BLACK;

	for (let row = 0; row < rows; row++) {
		const line = lines[row];
		let col = 0;

		for (let i = 0; i < line.length; i++) {
			const c = line[i];

			// escape sequence:
			// \fX : foreground X, dark
			// \FX : foreground X, bright
			// \bX : background X, dark
			// \BX : background X, bright
			// \aX : anchor in group X
			if (
				c === "\\" &&
				i + 2 < line.length &&
				"fFbBa".includes(line[i + 1]) &&
				!isNaN(Number(line[i + 2]))
			) {
				const num = Math.max(Math.min(Number(line[i + 2]), 9), 0); // 0..9

				switch (line[i + 1]) {
					case "f":
						fg = num;

						break;

					case "F":
						fg = num + 8;

						break;

					case "b":
						bg = num;

						break;

					case "B":
						bg = num + 8;

						break;

					case "a":
						let anchors: Cell[] | null = null;

						if (glyphs.anchors[num] === undefined) {
							glyphs.anchors[num] = [];
						}

						anchors = glyphs.anchors[num] as Cell[];
						anchors.push({ row, col });

						break;
				}

				i += 2;

				continue;
			}

			// tab
			if (c === "\t") {
				const tab_chars = TAB_WIDTH - (col % TAB_WIDTH);

				/*
				for (let i = 0; i < tab_chars; i++) {
					// fill tab width with spaces
					const data_idx = row * cols + col;
					const char_code = charCodeInCp437(" ".codePointAt(0));

					const colour_byte = ((fg & 0b1111) << 4) | (bg & 0b1111);
					const glyph = (colour_byte << 8) | (char_code & 0xff);

					glyphs.data[data_idx] = glyph;

					col++;
				}
				*/

				col += tab_chars;

				continue;
			}

			// shouldn't happen
			if (col + 1 > cols) {
				console.log("textToLines generated a line that exceeds cols: ", line);
				break;
			}

			const data_idx = row * cols + col;
			const char_code = charCodeInCp437(line.codePointAt(i));

			const colour_byte = ((fg & 0b1111) << 4) | (bg & 0b1111);
			const glyph = (colour_byte << 8) | (char_code & 0xff);

			glyphs.data[data_idx] = glyph;

			col++;
		}
	}
	return glyphs;
}

export enum TexGlyphMode {
	SAMPLE = 0,
	GLYPHS = 1,
	MIX = 2,
	ROWS = 3,
	COLS = 4
}

export type TexGlyphs = {
	data: Uint32Array;
	rows: number;
	cols: number;
};

export function textureGlyphs(rows: number, cols: number, mode: TexGlyphMode): TexGlyphs {
	const tglyphs = {
		data: new Uint32Array(rows * cols),
		rows,
		cols
	};

	const global_mode = mode;

	for (let data_idx = 0; data_idx < rows * cols; data_idx++) {
		const row = Math.floor(data_idx / cols);
		const col = data_idx % cols;

		if (global_mode == TexGlyphMode.MIX) {
			mode = (row + col) % 2 == 0 ? TexGlyphMode.SAMPLE : TexGlyphMode.GLYPHS;
		} else if (global_mode == TexGlyphMode.ROWS) {
			mode = row % 2 == 0 ? TexGlyphMode.SAMPLE : TexGlyphMode.GLYPHS;
		} else if (global_mode == TexGlyphMode.COLS) {
			mode = col % 2 == 0 ? TexGlyphMode.SAMPLE : TexGlyphMode.GLYPHS;
		}

		const glyph = ((row & 0xff) << 24) | ((mode & 0xff) << 16) | (col & 0xffff);

		tglyphs.data[data_idx] = glyph;
	}

	return tglyphs;
}
