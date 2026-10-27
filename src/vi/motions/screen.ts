import { Pos } from "../buffer.ts";
import type { MotionContext, MotionDescription, MotionResult, MotionResolver } from "./types.ts";

function screenLine(context: MotionContext, offset: number): Pos | null {
	const display_row = context.layout.displayRows[context.viewport_top + offset];

	if (display_row === undefined) {
		return null;
	}

	return context.layout.bufferAtVisibleCol(display_row.line, display_row.row_in_line, 0);
}

// H M L: screen-relative lines
function resolveScreenLineMotion(motion: MotionDescription, context: MotionContext): MotionResult {
	const offset =
		motion.name === "H"
			? Math.max(1, motion.count) - 1
			: motion.name === "M"
				? Math.floor((context.screen_rows - 1) / 2)
				: Math.max(0, context.screen_rows - Math.max(1, motion.count));

	const target = screenLine(context, offset);
	return target === null ? null : { to: target, kind: "linewise" };
}

// j k: one display row down or up, so wrapped lines behave intuitively
function resolveDisplayMotion(
	motion: MotionDescription,
	from: Pos,
	context: MotionContext
): MotionResult {
	const rows = context.layout.displayRows;
	const here = context.layout.bufferToScreen(from);
	const first = context.layout.firstRowOfLine[from.line] ?? 0;
	const current = first + here.row;
	const delta = motion.name === "j" ? Math.max(1, motion.count) : -Math.max(1, motion.count);

	const target = Math.max(0, Math.min(rows.length - 1, current + delta));
	const display_row = rows[target];

	if (display_row === undefined) {
		return null;
	}

	return { to: new Pos(display_row.line, 0), kind: "linewise" };
}

export const resolveScreenMotion: MotionResolver = (motion, from, context) => {
	if (motion.name === "j" || motion.name === "k") {
		return resolveDisplayMotion(motion, from, context);
	}

	return resolveScreenLineMotion(motion, context);
};
