import { Pos } from "../buffer.ts";
import { searchNext } from "../search.ts";
import type { MotionResolver } from "./types.ts";

/**
 * 'x and `x: jump to a mark, linewise or exact; '' and `` jump to the last
 * jump position.
 */
export const resolveMarkMotion: MotionResolver = (motion, _from, context) => {
	const mark = motion.char === undefined ? context.last_jump : context.marks.get(motion.char);

	if (mark === undefined || mark === null) {
		return null;
	}

	if (motion.name === "mark_line") {
		return { to: new Pos(mark.line, 0), kind: "linewise" };
	}

	return { to: mark, kind: "exclusive" };
};

/**
 * N and N: repeat the last search, N in the opposite direction.
 */
export const resolveSearchMotion: MotionResolver = (motion, from, context) => {
	const forward = (motion.name === "n") === context.search.forward;
	const found = searchNext(context.buffer, from, context.search.pattern, forward);
	return found === null ? null : { to: found, kind: "exclusive" };
};
