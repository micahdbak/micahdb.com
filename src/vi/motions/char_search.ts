import type { Buffer } from "../buffer.ts";
import { Pos } from "../buffer.ts";
import type { MotionResolver } from "./types.ts";

function findCharInLine(
	buffer: Buffer,
	from: Pos,
	ch: string | undefined,
	forward: boolean,
	before_target: boolean,
	count: number
): Pos | null {
	const line = buffer.lineText(from.line);
	let col = from.col;

	for (let i = 0; i < count; i++) {
		let found = -1;

		if (ch !== undefined) {
			found = forward ? line.indexOf(ch, col + 1) : col > 0 ? line.lastIndexOf(ch, col - 1) : -1;
		}

		if (found === -1) {
			return null;
		}

		col = found;
	}

	if (before_target) {
		return new Pos(from.line, Math.max(0, forward ? col - 1 : col + 1));
	}

	return new Pos(from.line, col);
}

/**
 * f F t T: find a character on the current line; ; and , repeat the last
 * search, comma reversing its direction.
 */
export const resolveCharSearchMotion: MotionResolver = (motion, from, context) => {
	const find_names = ["f", "F", "t", "T"];
	let char: string | undefined;
	let forward: boolean;
	let before_target: boolean;

	if (find_names.includes(motion.name)) {
		char = motion.char;
		forward = motion.name === "f" || motion.name === "t";
		before_target = motion.name === "t" || motion.name === "T";
	} else {
		const last = context.last_char_search;

		if (last === null) {
			return null;
		}

		char = last.char;
		forward = (motion.name === ";") === last.forward;
		before_target = last.before_target;
	}

	const count = Math.max(1, motion.count);
	const found = findCharInLine(context.buffer, from, char, forward, before_target, count);
	return found === null ? null : { to: found, kind: "inclusive" };
};
