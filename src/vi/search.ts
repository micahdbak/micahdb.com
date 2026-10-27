import type { Buffer } from "./buffer.ts";
import { Pos } from "./buffer.ts";

export type SearchState = { pattern: string; forward: boolean };

export const SEARCH_NOT_FOUND = "E486: Pattern not found: ";

/**
 * Literal substring search with wrap-around: forward finds the first match
 * after the cursor, backward the last match before it.
 */
export function searchNext(
	buffer: Buffer,
	from: Pos,
	pattern: string,
	forward: boolean
): Pos | null {
	if (pattern === "") {
		return null;
	}

	const lines = buffer.lineCount();
	const step = forward ? 1 : -1;

	for (let offset = 1; offset <= lines; offset++) {
		const line = (((from.line + step * offset) % lines) + lines) % lines;
		const text = buffer.lineText(line);

		const index =
			line === from.line
				? forward
					? text.indexOf(pattern, from.col + 1)
					: from.col === 0
					? -1
					: text.lastIndexOf(pattern, from.col - 1)
				: forward
					? text.indexOf(pattern)
					: text.lastIndexOf(pattern);

		if (index !== -1) {
			return new Pos(line, index);
		}
	}

	return null;
}
