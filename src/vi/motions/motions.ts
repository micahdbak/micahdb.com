import type { Pos } from "../buffer.ts";
import type { MotionContext, MotionDescription, MotionResult, MotionResolver } from "./types.ts";
import { resolveLineMotion } from "./lines.ts";
import { resolveScreenMotion } from "./screen.ts";
import { resolveWordMotion } from "./word.ts";
import { resolveCharSearchMotion } from "./char_search.ts";
import { resolveBracketMotion } from "./bracket.ts";
import { resolveSentenceMotion } from "./sentence.ts";
import { resolveParagraphMotion } from "./paragraph.ts";
import { resolveMarkMotion, resolveSearchMotion } from "./marks.ts";

export type {
	MotionContext,
	MotionDescription,
	MotionKind,
	MotionResult,
} from "./types.ts";
export { isJumpMotion } from "./types.ts";

const RESOLVERS: Record<string, MotionResolver> = {
	h: resolveLineMotion,
	l: resolveLineMotion,
	"0": resolveLineMotion,
	"^": resolveLineMotion,
	$: resolveLineMotion,
	"|": resolveLineMotion,
	G: resolveLineMotion,
	"+": resolveLineMotion,
	"-": resolveLineMotion,
	enter: resolveLineMotion,

	j: resolveScreenMotion,
	k: resolveScreenMotion,
	H: resolveScreenMotion,
	M: resolveScreenMotion,
	L: resolveScreenMotion,

	w: resolveWordMotion,
	W: resolveWordMotion,
	b: resolveWordMotion,
	B: resolveWordMotion,
	e: resolveWordMotion,
	E: resolveWordMotion,
	ge: resolveWordMotion,
	gE: resolveWordMotion,

	f: resolveCharSearchMotion,
	F: resolveCharSearchMotion,
	t: resolveCharSearchMotion,
	T: resolveCharSearchMotion,
	";": resolveCharSearchMotion,
	",": resolveCharSearchMotion,

	"%": resolveBracketMotion,
	"(": resolveSentenceMotion,
	")": resolveSentenceMotion,
	"{": resolveParagraphMotion,
	"}": resolveParagraphMotion,

	mark_exact: resolveMarkMotion,
	mark_line: resolveMarkMotion,
	n: resolveSearchMotion,
	N: resolveSearchMotion,
};

/**
 * Resolves a motion descriptor against the buffer, returning where the
 * motion lands and its kind, or null when the motion fails.
 */
export function resolveMotion(
	motion: MotionDescription,
	from: Pos,
	context: MotionContext
): MotionResult {
	const resolver = RESOLVERS[motion.name];

	if (resolver === undefined) {
		return null;
	}

	return resolver(motion, from, context);
}
