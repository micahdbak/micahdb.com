import type { Buffer } from "../buffer.ts";
import { Pos } from "../buffer.ts";
import { isEmptyLineAt, nextChar, prevChar } from "./traverse.ts";
import type { MotionResolver } from "./types.ts";

type WordClass = "blank" | "word" | "punct" | "non-blank";

export function charClass(ch: string | undefined, big: boolean): WordClass {
	if (ch === undefined || ch === " " || ch === "\t") {
		return "blank";
	}

	if (big) {
		return "non-blank";
	}

	return /[A-Za-z0-9_]/.test(ch) ? "word" : "punct";
}

/**
 * The position is on the same line and in the same word class: the word
 * run continues through it
 */
function continues(
	position: Pos,
	from: Pos,
	buffer: Buffer,
	big: boolean,
	class_here: WordClass
): boolean {
	return position.line === from.line && charClass(buffer.charAt(position), big) === class_here;
}

/**
 * W / W: the start of the next word. Word runs never cross a line break,
 * and empty lines count as words, so the motion stops on them.
 */
export function wordForward(buffer: Buffer, from: Pos, big: boolean): Pos | null {
	let position = from;

	if (isEmptyLineAt(buffer, position) && position.line < buffer.lineCount() - 1) {
		return new Pos(position.line + 1, 0);
	}

	const here = buffer.charAt(position);

	if (here !== undefined && charClass(here, big) !== "blank") {
		const class_here = charClass(here, big);

		while (true) {
			const next = nextChar(buffer, position);

			if (next === null || !continues(next, position, buffer, big, class_here)) {
				break;
			}

			position = next;
		}
	}

	while (true) {
		const next = nextChar(buffer, position);

		if (next === null) {
			return null;
		}

		position = next;

		if (isEmptyLineAt(buffer, position) || !buffer.isBlankAt(position)) {
			return position;
		}
	}
}

/**
 * B / B: the start of the previous word, stopping on empty lines.
 */
export function wordBackward(buffer: Buffer, from: Pos, big: boolean): Pos | null {
	let position = prevChar(buffer, from);

	if (position === null) {
		return null;
	}

	while (buffer.isBlankAt(position) && !isEmptyLineAt(buffer, position)) {
		const prev = prevChar(buffer, position);

		if (prev === null) {
			return position;
		}

		position = prev;
	}

	const class_here = charClass(buffer.charAt(position), big);

	while (true) {
		const prev = prevChar(buffer, position);

		if (prev === null || !continues(prev, position, buffer, big, class_here)) {
			return position;
		}

		position = prev;
	}
}

/**
 * E / E: the end of the current or next word. Word ends cross newlines and
 * skip empty lines, but never extend past the end of their own line.
 */
export function wordEnd(buffer: Buffer, from: Pos, big: boolean): Pos | null {
	let position = nextChar(buffer, from);

	if (position === null) {
		return null;
	}

	while (buffer.charAt(position) === undefined || buffer.isBlankAt(position)) {
		const next = nextChar(buffer, position);

		if (next === null) {
			return null;
		}

		position = next;
	}

	const class_here = charClass(buffer.charAt(position), big);

	while (true) {
		const next = nextChar(buffer, position);

		if (next === null || !continues(next, position, buffer, big, class_here)) {
			return position;
		}

		position = next;
	}
}

/**
 * Ge / gE: the end of the previous word.
 */
export function wordEndBackward(buffer: Buffer, from: Pos, big: boolean): Pos | null {
	let position = prevChar(buffer, from);

	if (position === null) {
		return null;
	}

	/**
	 * Skip the tail of the word the cursor stands in; word runs never
	 * cross a line break, so a previous line's tail is the previous word
	 */
	const start_class = charClass(buffer.charAt(from), big);

	if (start_class !== "blank") {
		while (position.line === from.line && charClass(buffer.charAt(position), big) === start_class) {
			const prev = prevChar(buffer, position);

			if (prev === null) {
				return null;
			}

			position = prev;
		}
	}

	while (buffer.isBlankAt(position)) {
		const prev = prevChar(buffer, position);

		if (prev === null) {
			return null;
		}

		position = prev;
	}

	return position;
}

export const resolveWordMotion: MotionResolver = (motion, from, context) => {
	const big = ["W", "B", "E", "gE"].includes(motion.name);
	const buffer = context.buffer;

	let position: Pos | null = from;

	for (let i = 0; i < Math.max(1, motion.count) && position !== null; i++) {
		if (motion.name === "w" || motion.name === "W") {
			position = wordForward(buffer, position, big);
		} else if (motion.name === "b" || motion.name === "B") {
			position = wordBackward(buffer, position, big);
		} else if (motion.name === "ge" || motion.name === "gE") {
			position = wordEndBackward(buffer, position, big);
		} else {
			position = wordEnd(buffer, position, big);
		}
	}

	if (position === null) {
		return null;
	}

	return motion.name === "w" || motion.name === "W" || motion.name === "b" || motion.name === "B"
		? { to: position, kind: "exclusive" }
		: { to: position, kind: "inclusive" };
};
