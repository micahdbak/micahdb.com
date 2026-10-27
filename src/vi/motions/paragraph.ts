import type { Buffer } from "../buffer.ts";
import { Pos } from "../buffer.ts";
import type { MotionResolver } from "./types.ts";

/**
 * } : the next blank line, or the first line of the next paragraph when
 * already on a blank line.
 */
function paragraphForward(buffer: Buffer, from: Pos): Pos | null {
	if (buffer.isEmptyLine(from.line)) {
		for (let line = from.line + 1; line < buffer.lineCount(); line++) {
			if (!buffer.isEmptyLine(line)) {
				return new Pos(line, 0);
			}
		}

		return null;
	}

	for (let line = from.line + 1; line < buffer.lineCount(); line++) {
		if (buffer.isEmptyLine(line)) {
			return new Pos(line, 0);
		}
	}

	return null;
}

/**
 * { : the first line of the previous paragraph, or the first non-blank line
 * before the cursor when already on a blank line.
 */
function paragraphBackward(buffer: Buffer, from: Pos): Pos | null {
	if (buffer.isEmptyLine(from.line)) {
		for (let line = from.line - 1; line >= 0; line--) {
			if (!buffer.isEmptyLine(line)) {
				return new Pos(line, 0);
			}
		}

		return new Pos(0, 0);
	}

	for (let line = from.line - 1; line >= 0; line--) {
		if (buffer.isEmptyLine(line)) {
			return new Pos(line + 1, 0);
		}
	}

	return new Pos(0, 0);
}

export const resolveParagraphMotion: MotionResolver = (motion, from, context) => {
	const buffer = context.buffer;
	const forward = motion.name === "}";

	const found = forward ? paragraphForward(buffer, from) : paragraphBackward(buffer, from);
	return found === null ? null : { to: found, kind: "exclusive" };
};
