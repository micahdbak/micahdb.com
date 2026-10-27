import { TAB_WIDTH } from "@micahdb/tscon";
import { Pos, Range } from "./buffer.ts";
import type { Buffer } from "./buffer.ts";
import type { Registers } from "./registers.ts";
import type { OperatorName } from "./parser.ts";
import type { MotionKind } from "./motions/types.ts";

export type OperatorResult = { cursor: Pos; enter_insert: boolean };

export type OperatorContext = { buffer: Buffer; registers: Registers; register?: string };

const SHIFT_WIDTH = "\t";

/**
 * Removes exactly one shiftwidth of leading indentation, measured in
 * columns the way tabs expand.
 */
function unshiftLine(text: string): string {
	let columns = 0;
	let index = 0;

	while (index < text.length && (text[index] === " " || text[index] === "\t")) {
		columns += text[index] === "\t" ? TAB_WIDTH - (columns % TAB_WIDTH) : 1;
		index++;
	}

	if (index === 0) {
		return text;
	}

	const shifted = Math.floor((columns - 1) / TAB_WIDTH) * TAB_WIDTH;
	return "\t".repeat(shifted / TAB_WIDTH) + text.slice(index);
}

function caseOf(ch: string, mode: "lower" | "upper" | "toggle"): string {
	if (mode === "lower") {
		return ch.toLowerCase();
	}

	if (mode === "upper") {
		return ch.toUpperCase();
	}

	return ch === ch.toLowerCase() ? ch.toUpperCase() : ch.toLowerCase();
}

function applyCase(buffer: Buffer, range: Range, mode: "lower" | "upper" | "toggle"): Pos {
	const ordered = range.normalized();

	for (let line = ordered.start.line; line <= ordered.end.line; line++) {
		const text = buffer.lineText(line);
		const from = line === ordered.start.line ? ordered.start.col : 0;
		const to = line === ordered.end.line && !ordered.linewise ? ordered.end.col : text.length;

		let changed = "";

		for (const [col, ch] of [...text].entries()) {
			changed += col >= from && col < to ? caseOf(ch, mode) : ch;
		}

		buffer.lines[line] = changed;
	}

	buffer.modified = true;
	const last = Math.max(0, buffer.lineLength(ordered.start.line) - 1);

	return ordered.start.withCol(Math.min(ordered.start.col, last));
}

/**
 * The vi line-boundary adjustments, applied to charwise ranges that end at
 * column 0 of a later line:
 *
 * 1. exclusive motion with the start at or before its first non-blank
 *    becomes linewise (dw on a line's first word deletes whole lines)
 * 2. exclusive motion otherwise pulls back to the end of the previous line
 *    (dw on a line's last word deletes to end of line, never joins)
 * 3. inclusive motion pulls back to the end of the previous line
 */
export function adjustedRange(buffer: Buffer, range: Range, kind: MotionKind): Range {
	const ordered = range.normalized();

	if (ordered.linewise || ordered.end.line <= ordered.start.line || ordered.end.col !== 0) {
		return ordered;
	}

	const pulled_back = new Pos(ordered.end.line - 1, buffer.lineLength(ordered.end.line - 1));

	if (kind === "exclusive" && ordered.start.col <= buffer.firstNonBlank(ordered.start.line).col) {
		return new Range(ordered.start, new Pos(ordered.end.line - 1, 0), true);
	}

	return new Range(ordered.start, pulled_back, false);
}

// the resting column after a charwise delete or yank: the last character
// removed, clamped into the line
function restingCol(buffer: Buffer, start: Pos, line: number, linewise: boolean): number {
	if (linewise) {
		return buffer.firstNonBlank(line).col;
	}

	const last = Math.max(0, buffer.lineLength(line) - 1);
	return Math.min(start.col, last);
}

/**
 * Applies an operator to a resolved range: records the deleted or yanked
 * text into the registers, transforms the buffer, and reports where the
 * cursor lands and whether an insert session should begin.
 */
export function applyOperator(
	operator: OperatorName,
	range: Range,
	kind: MotionKind,
	context: OperatorContext
): OperatorResult | null {
	const buffer = context.buffer;
	const adjusted = range.linewise ? range.normalized() : adjustedRange(buffer, range, kind);

	const start = adjusted.start;
	const linewise = adjusted.linewise;

	switch (operator) {
		case "d": {
			context.registers.record({ text: buffer.textOf(adjusted), linewise }, context.register);
			buffer.remove(adjusted);

			const line = Math.min(start.line, buffer.lineCount() - 1);
			return { cursor: new Pos(line, restingCol(buffer, start, line, linewise)), enter_insert: false };
		}

		case "c": {
			// removal of the whole buffer leaves a sentinel empty line, which
			// is exactly the blank line cc opens
			const covers_all = linewise && start.line === 0 && adjusted.end.line >= buffer.lineCount() - 1;

			context.registers.record({ text: buffer.textOf(adjusted), linewise }, context.register);
			buffer.remove(adjusted);

			// cc opens a fresh blank line where the range began
			if (linewise && !covers_all) {
				buffer.lines.splice(start.line, 0, "");
			}

			const col = linewise ? 0 : Math.min(start.col, buffer.lineLength(start.line));
			return { cursor: new Pos(start.line, col), enter_insert: true };
		}

		case "y": {
			context.registers.recordYank({ text: buffer.textOf(adjusted), linewise }, context.register);

			const line = Math.min(start.line, buffer.lineCount() - 1);
			return { cursor: new Pos(line, restingCol(buffer, start, line, linewise)), enter_insert: false };
		}

		case "<":
		case ">": {
			const from_line = Math.min(start.line, buffer.lineCount() - 1);
			const to_line = Math.min(adjusted.end.line, buffer.lineCount() - 1);

			for (let line = from_line; line <= to_line; line++) {
				const text = buffer.lineText(line);
				buffer.lines[line] = operator === ">" ? SHIFT_WIDTH + text : unshiftLine(text);
			}

			buffer.modified = true;
			return { cursor: buffer.firstNonBlank(from_line), enter_insert: false };
		}

		case "gu":
		case "gU":
		case "g~": {
			const mode = operator === "gu" ? "lower" : operator === "gU" ? "upper" : "toggle";
			return { cursor: applyCase(buffer, adjusted, mode), enter_insert: false };
		}
	}

	return null;
}

/**
 * Buffer ranges for the sugar commands x / X / D / C / s / S / ~, with vi's
 * clamping: they stop at end of line and fail on empty lines.
 */
export function sugarRange(buffer: Buffer, from: Pos, count: number, key: string): Range | null {
	const length = buffer.lineLength(from.line);

	switch (key) {
		case "x":
		case "s":
		case "~": {
			if (length === 0 || from.col >= length) {
				return null;
			}

			return new Range(from, new Pos(from.line, Math.min(length, from.col + count)), false);
		}

		case "X": {
			if (from.col === 0) {
				return null;
			}

			const from_col = Math.max(0, from.col - count);
			return new Range(new Pos(from.line, from_col), new Pos(from.line, from.col), false);
		}

		case "D":
		case "C": {
			const line = Math.min(buffer.lineCount() - 1, from.line + count - 1);
			return new Range(from, new Pos(line, buffer.lineLength(line)), false);
		}

		case "S": {
			const to = Math.min(buffer.lineCount() - 1, from.line + count - 1);
			return new Range(new Pos(from.line, 0), new Pos(to, 0), true);
		}
	}

	return null;
}
