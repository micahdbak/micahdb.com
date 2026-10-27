import type { Buffer } from "../buffer.ts";
import { Pos } from "../buffer.ts";
import { nextChar, prevChar } from "./traverse.ts";
import type { MotionResolver } from "./types.ts";

const OPENS: Record<string, string> = { "(": ")", "[": "]", "{": "}" };
const CLOSES: Record<string, string> = { ")": "(", "]": "[", "}": "}" };

/**
 * %: the bracket matching the one at or after the cursor, scanning either
 * direction with nesting.
 */
function matchBracket(buffer: Buffer, from: Pos): Pos | null {
	const here = buffer.charAt(from);
	const bracket = here !== undefined && (OPENS[here] !== undefined || CLOSES[here] !== undefined);
	let open_at: Pos | null = bracket ? from : null;

	if (open_at === null) {
		const line = buffer.lineText(from.line);

		for (let col = from.col; col < line.length; col++) {
			const ch = line[col];

			if (ch !== undefined && (OPENS[ch] !== undefined || CLOSES[ch] !== undefined)) {
				open_at = new Pos(from.line, col);
				break;
			}
		}
	}

	if (open_at === null) {
		return null;
	}

	const open_ch = buffer.charAt(open_at);

	if (open_ch === undefined) {
		return null;
	}

	const forward = OPENS[open_ch] !== undefined;
	const target = forward ? OPENS[open_ch] : CLOSES[open_ch];

	let depth = 0;
	let position: Pos | null = open_at;

	while ((position = forward ? nextChar(buffer, position) : prevChar(buffer, position)) !== null) {
		const ch = buffer.charAt(position);

		if (ch === target && depth === 0) {
			return position;
		}

		if (ch === open_ch) {
			depth++;
		} else if (ch === target) {
			depth--;
		}
	}

	return null;
}

export const resolveBracketMotion: MotionResolver = (motion, from, context) => {
	const matched = matchBracket(context.buffer, from);
	return matched === null ? null : { to: matched, kind: "inclusive" };
};
