import { Pos } from "../buffer.ts";
import type { MotionResolver } from "./types.ts";

// h l 0 ^ $ | G + - and Enter: motions on logical lines
export const resolveLineMotion: MotionResolver = (motion, from, context) => {
	const buffer = context.buffer;
	const count = Math.max(1, motion.count);

	switch (motion.name) {
		case "h":
			return { to: new Pos(from.line, Math.max(0, from.col - count)), kind: "exclusive" };

		case "l": {
			const col = Math.min(buffer.lastCol(from.line).col, from.col + count);

			return { to: new Pos(from.line, col), kind: "exclusive" };
		}

		case "0":
			return { to: new Pos(from.line, 0), kind: "exclusive" };

		case "^":
			return { to: buffer.firstNonBlank(from.line), kind: "exclusive" };

		case "$": {
			const line = Math.min(buffer.lineCount() - 1, from.line + count - 1);
			return { to: buffer.lastCol(line), kind: "inclusive" };
		}

		case "|":
			return { to: new Pos(from.line, Math.max(0, count - 1)), kind: "exclusive" };

		case "G": {
			const last = buffer.lineCount() - 1;
			const line = motion.count === 0 ? last : Math.min(last, count - 1);

			return { to: new Pos(line, 0), kind: "linewise" };
		}

		case "+":
		case "enter":
			return { to: new Pos(Math.min(buffer.lineCount() - 1, from.line + count), 0), kind: "linewise" };

		case "-":
			return { to: new Pos(Math.max(0, from.line - count), 0), kind: "linewise" };
	}

	return null;
};
