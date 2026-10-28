import { Pos, Range } from "../buffer.ts";
import { resolveMotion, isJumpMotion } from "../motions/motions.ts";
import type { MotionDescription, MotionKind } from "../motions/types.ts";
import { applyOperator, sugarRange } from "../operators.ts";
import type { OperatorContext } from "../operators.ts";
import { SEARCH_NOT_FOUND } from "../search.ts";
import type { OperatorCommand, OperatorName, SimpleCommand } from "../parser.ts";
import type { Editor } from "./editor.ts";
import { startSession } from "./insert.ts";
import { repeatCommand } from "./repeat.ts";

// cursor movement for a motion command, applying sticky column rules
export function doMotion(editor: Editor, motion: MotionDescription): void {
	if (motion.name === "j" || motion.name === "k") {
		moveDisplay(editor, motion.count, motion.name === "j");
		return;
	}

	const result = resolveMotion(motion, editor.cursor.pos, editor.motionContext());

	if (result === null) {
		if (motion.name === "n" || motion.name === "N") {
			editor.flash(SEARCH_NOT_FOUND + editor.search.pattern);
		}

		return;
	}

	recordCharSearch(editor, motion);

	if (isJumpMotion(motion.name)) {
		editor.last_jump = editor.cursor.pos;
	}

	if (result.kind === "linewise") {
		editor.cursor.setExact(editor.buffer.firstNonBlank(result.to.line));
		return;
	}

	editor.placeCursor(result.to);
}

/**
 * Vertical movement in display rows, which is how wrapped lines behave
 * under j / k and the paging commands.
 */
export function moveDisplay(editor: Editor, count: number, down: boolean): void {
	const display_count = Math.max(1, count);
	const rows = editor.layout.displayRows;
	const here = editor.layout.bufferToScreen(editor.cursor.pos);
	const first = editor.layout.firstRowOfLine[editor.cursor.pos.line] ?? 0;
	const current = first + here.row;

	const delta = down ? display_count : -display_count;
	const target = Math.max(0, Math.min(rows.length - 1, current + delta));
	const display_row = rows[target];

	if (display_row === undefined) {
		return;
	}

	if (display_row.line !== editor.cursor.pos.line) {
		const raw_rows = editor.layout.rawRowCount(display_row.line);

		/**
		 * Entering a line that renders raw from below puts the cursor on
		 * its bottom raw row; from above, on its top
		 */
		if (raw_rows !== null) {
			editor.layout.setRawLine(display_row.line);
			const entry_row = down ? 0 : raw_rows - 1;
			const sticky = editor.cursor.sticky ?? here.col;

			editor.cursor.sticky = sticky;
			editor.cursor.pos = editor.layout.bufferAtVisibleCol(display_row.line, entry_row, sticky);
			return;
		}
	}

	const sticky = editor.cursor.sticky ?? here.col;
	editor.cursor.sticky = sticky;
	const at = editor.layout.bufferAtVisibleCol(display_row.line, display_row.row_in_line, sticky);
	editor.cursor.pos = at;
}

const FIND_NAMES = ["f", "F", "t", "T"];

/**
 * F/F/t/T record their target for ; and , -- as motions and as operator
 * targets alike
 */
function recordCharSearch(editor: Editor, motion: MotionDescription): void {
	if (!FIND_NAMES.includes(motion.name)) {
		return;
	}

	const forward = motion.name === "f" || motion.name === "t";
	const before_target = motion.name === "t" || motion.name === "T";

	editor.last_char_search = { char: motion.char ?? "", forward, before_target };
}

function operatorContext(editor: Editor, register?: string): OperatorContext {
	return { buffer: editor.buffer, registers: editor.registers, register };
}

export function doOperatorCommand(editor: Editor, command: OperatorCommand): void {
	let range: Range | null;
	let kind: MotionKind = "linewise";

	if (command.linewise || command.motion === null) {
		const from = editor.cursor.pos.line;
		const to = Math.min(editor.buffer.lineCount() - 1, from + command.count - 1);
		range = new Range(new Pos(from, 0), new Pos(to, 0), true);
	} else {
		const motion = changeMotion(editor, command.operator, command.motion);
		const result = resolveMotion(motion, editor.cursor.pos, editor.motionContext());

		if (result === null) {
			if (motion.name === "n" || motion.name === "N") {
				editor.flash(SEARCH_NOT_FOUND + editor.search.pattern);
			}

			return;
		}

		recordCharSearch(editor, motion);

		kind = result.kind;
		const to = result.kind === "inclusive" ? result.to.withCol(result.to.col + 1) : result.to;

		range =
			result.kind === "linewise"
				? new Range(new Pos(editor.cursor.pos.line, 0), new Pos(result.to.line, 0), true)
				: new Range(editor.cursor.pos, to, false);
	}

	// yanks are not changes: they leave the undo snapshot alone
	if (command.operator !== "y") {
		editor.rememberState();
	}

	const context = operatorContext(editor, command.register);
	const result = applyOperator(command.operator, range, kind, context);

	if (result === null) {
		return;
	}

	editor.afterEdit(range.normalized().start.line);
	editor.cursor.setExact(result.cursor);

	if (result.enter_insert) {
		editor.session = {
			location: "insert",
			count: 1,
			start: editor.cursor.pos,
			replace: false,
			change_base: {
				operator: command.operator,
				motion: command.motion,
				linewise: command.linewise,
				count: command.count,
				register: command.register,
			},
		};
		editor.mode = "insert";
		return;
	}

	editor.clampCursor();

	if (command.operator !== "c") {
		editor.repeat_last = command;
	}
}

function changeMotion(
	editor: Editor,
	operator: OperatorName,
	motion: MotionDescription
): MotionDescription {
	const wordish = motion.name === "w" || motion.name === "W";

	/**
	 * Cw behaves like ce when not on whitespace, so a change never
	 * swallows the blanks after the word
	 */
	if (operator !== "c" || !wordish || editor.buffer.isBlankAt(editor.cursor.pos)) {
		return motion;
	}

	return { ...motion, name: motion.name === "w" ? "e" : "E" };
}

/**
 * S, S and C are c on a sugar range: the range is deleted, and an insert
 * session begins whose repeat replays both halves.
 */
export function startSugarChange(
	editor: Editor,
	key: string,
	count: number,
	register?: string
): void {
	editor.mode = "insert";
	editor.session = {
		location: "insert",
		count: 1,
		start: editor.cursor.pos,
		replace: false,
		change_base: { operator: "c", motion: null, linewise: key === "S", count, register, sugar: key },
	};
}

/**
 * Applies an operator to an explicit range, for the sugar commands and the
 * ex entry points.
 */
export function applyOperatorRange(
	editor: Editor,
	operator: OperatorName,
	range: Range,
	kind: MotionKind,
	register?: string
): void {
	if (operator !== "y") {
		editor.rememberState();
	}

	const context = operatorContext(editor, register);
	const result = applyOperator(operator, range, kind, context);

	if (result === null) {
		return;
	}

	editor.afterEdit(range.normalized().start.line);
	editor.cursor.setExact(result.cursor);

	/**
	 * A change enters insert mode, whose cursor may rest past the last
	 * character; normal-mode clamping would pull it back
	 */
	if (!result.enter_insert) {
		editor.clampCursor();
	}
}

export function doSimple(editor: Editor, command: SimpleCommand): void {
	const { key, count, char, register } = command;
	const cursor = editor.cursor.pos;

	switch (key) {
		case "r": {
			const length = editor.buffer.lineLength(cursor.line);

			if (char === undefined || length === 0 || cursor.col >= length) {
				return;
			}

			editor.rememberState();
			const times = Math.min(count, length - cursor.col);
			const line = editor.buffer.lineText(cursor.line);
			const head = line.slice(0, cursor.col);
			const tail = line.slice(cursor.col + times);

			editor.buffer.lines[cursor.line] = head + char.repeat(times) + tail;
			editor.buffer.modified = true;
			editor.afterEdit(cursor.line);
			editor.cursor.setExact(new Pos(cursor.line, cursor.col + times - 1));
			editor.repeat_last = { kind: "repeat_simple", key, count, char, register };
			return;
		}

		case "x":
		case "X":
		case "D":
		case "C":
		case "s":
		case "S":
		case "~": {
			const range = sugarRange(editor.buffer, cursor, count, key);

			if (range === null) {
				return;
			}

			const deletes = key === "D" || key === "x" || key === "X";
			const operator: OperatorName = deletes ? "d" : key === "~" ? "g~" : "c";
			applyOperatorRange(editor, operator, range, key === "S" ? "linewise" : "exclusive", register);

			if (key === "~") {
				const end = range.normalized().end;
				editor.cursor.setExact(new Pos(end.line, Math.max(0, end.col - 1)));
			} else if (operator === "c") {
				startSugarChange(editor, key, count, register);
				return;
			}

			editor.repeat_last = { kind: "repeat_simple", key, count, register };
			return;
		}

		case "J": {
			const joins = Math.min(Math.max(1, count - 1), editor.buffer.lineCount() - 1 - cursor.line);

			if (joins <= 0) {
				return;
			}

			editor.rememberState();
			const join_col = editor.buffer.lineLength(cursor.line);

			for (let i = 0; i < joins; i++) {
				editor.buffer.joinLine(cursor.line);
			}

			editor.afterEdit(cursor.line);
			editor.cursor.setExact(new Pos(cursor.line, join_col));
			editor.repeat_last = { kind: "repeat_simple", key, count, register };
			return;
		}

		case "p":
			editor.put(false, count, register);
			return;

		case "P":
			editor.put(true, count, register);
			return;

		case "u":
			editor.undo();
			return;

		case "U":
			editor.undoLine();
			return;

		case ".":
			repeatCommand(editor);
			return;

		case "R":
			startSession(editor, "insert", count, true);
			return;

		case "i":
			startSession(editor, "insert", count, false);
			return;

		case "I":
			startSession(editor, "line_start", count, false);
			return;

		case "a":
			startSession(editor, "append", count, false);
			return;

		case "A":
			startSession(editor, "append_eol", count, false);
			return;

		case "o":
			startSession(editor, "open_below", count, false);
			return;

		case "O":
			startSession(editor, "open_above", count, false);
			return;

		case "m":
			editor.marks.set(char ?? "", editor.cursor.pos);
			return;

		case "<c-f>":
		case "<c-b>":
		case "<c-d>":
		case "<c-u>": {
			const forward = key === "<c-f>" || key === "<c-d>";
			const half = key === "<c-d>" || key === "<c-u>";
			const rows = half ? Math.floor(editor.viewport.rows / 2) : editor.viewport.rows - 2;

			moveDisplay(editor, Math.max(1, rows), forward);
			return;
		}
	}
}

