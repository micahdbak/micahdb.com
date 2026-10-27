import type { Buffer, Pos } from "../buffer.ts";
import { isEmptyLineAt, nextChar, prevChar } from "./traverse.ts";
import type { MotionResolver } from "./types.ts";

/**
 * Sentence ends: [.!?] followed by whitespace or end of line, or a blank
 * line.
 */
function sentenceForward(buffer: Buffer, from: Pos): Pos | null {
	let position: Pos | null = from;
	let after_punct = false;

	while ((position = nextChar(buffer, position)) !== null) {
		const ch = buffer.charAt(position);

		if (isEmptyLineAt(buffer, position) && !after_punct) {
			return position;
		}

		if (after_punct) {
			if (ch !== undefined && ".!?".includes(ch)) {
				continue;
			}

			if (ch !== undefined && (ch === " " || ch === "\t")) {
				continue;
			}

			return position;
		}

		if (ch !== undefined && ".!?".includes(ch)) {
			after_punct = true;
		}
	}

	return null;
}

function sentenceBackward(buffer: Buffer, from: Pos): Pos | null {
	let position: Pos | null = from;
	let sentence_start: Pos | null = null;
	let prev_was_blank = false;

	while ((position = prevChar(buffer, position)) !== null) {
		const ch = buffer.charAt(position);

		if (isEmptyLineAt(buffer, position) && sentence_start !== null) {
			return sentence_start;
		}

		if (isEmptyLineAt(buffer, position)) {
			prev_was_blank = true;
			continue;
		}

		if (ch !== undefined && ".!?".includes(ch)) {
			const after = nextChar(buffer, position);

			if (after !== null && (after.line !== position.line || buffer.isBlankAt(after))) {
				sentence_start = after;

				if (prev_was_blank) {
					return sentence_start;
				}
			}
		} else {
			prev_was_blank = false;
		}
	}

	return sentence_start;
}

export const resolveSentenceMotion: MotionResolver = (motion, from, context) => {
	const buffer = context.buffer;
	const forward = motion.name === ")";

	const found = forward ? sentenceForward(buffer, from) : sentenceBackward(buffer, from);
	return found === null ? null : { to: found, kind: "exclusive" };
};
