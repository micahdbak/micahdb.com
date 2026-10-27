import { Pos, Range } from "../buffer.ts";
import type { Editor } from "./editor.ts";
import type { InsertLocation, Repeat } from "./types.ts";

/**
 * Counted inserts (3i, 3o) duplicate the typed segment once on exit; the
 * open variants repeat onto new lines, the others inline.
 */
export function duplicatedText(text: string, count: number, location: InsertLocation): string {
	if (count <= 1 || text.length === 0) {
		return "";
	}

	const separator = location === "open_below" || location === "open_above" ? "\n" : "";
	return separator + Array(count - 1).fill(text).join(separator);
}

export function startSession(
	editor: Editor,
	location: InsertLocation,
	count: number,
	replace: boolean
): void {
	editor.rememberState();

	const at = editor.cursor.pos;
	let start: Pos;

	switch (location) {
		case "append":
			start = new Pos(at.line, Math.min(editor.buffer.lineLength(at.line), at.col + 1));
			break;

		case "line_start":
			start = new Pos(at.line, 0);
			break;

		case "append_eol":
			start = new Pos(at.line, editor.buffer.lineLength(at.line));
			break;

		case "open_below":
			editor.buffer.splitLine(editor.buffer.endOfLine(at.line));
			start = new Pos(at.line + 1, 0);
			break;

		case "open_above":
			editor.buffer.splitLine(new Pos(at.line, 0));
			start = new Pos(at.line, 0);
			break;

		default:
			start = at;
	}

	editor.session = { location, count, start, replace, change_base: null };
	editor.mode = replace ? "replace" : "insert";
	editor.cursor.setExact(start);
	editor.afterEdit(at.line);
}

export function insertKey(editor: Editor, key: string): void {
	if (editor.session === null) {
		editor.mode = "normal";
		return;
	}

	if (key === "esc") {
		endSession(editor);
		return;
	}

	if (key === "enter") {
		const at = editor.cursor.pos;
		editor.buffer.splitLine(at);
		editor.cursor.setExact(new Pos(at.line + 1, 0));
		editor.afterEdit(at.line);
		return;
	}

	if (key === "<bs>") {
		insertBackspace(editor);
		return;
	}

	if (key === "<up>" || key === "<down>" || key === "<left>" || key === "<right>") {
		insertMove(editor, key);
		return;
	}

	if (key.length !== 1) {
		return;
	}

	const at = editor.cursor.pos;
	const line = editor.buffer.lineText(at.line);

	if (editor.mode === "replace" && at.col < line.length) {
		editor.buffer.lines[at.line] = line.slice(0, at.col) + key + line.slice(at.col + 1);
		editor.buffer.modified = true;
	} else {
		editor.buffer.insert(at, key);
	}

	editor.cursor.setExact(new Pos(at.line, at.col + 1));
	editor.afterEdit(at.line);
}

function insertBackspace(editor: Editor): void {
	const at = editor.cursor.pos;

	if (at.col > 0) {
		editor.buffer.remove(new Range(new Pos(at.line, at.col - 1), new Pos(at.line, at.col), false));
		editor.cursor.setExact(new Pos(at.line, at.col - 1));
	} else if (at.line > 0) {
		// a lossless join: the newline was split at exactly this spot, so
		// backspace removes it without adding a separator
		const previous_length = editor.buffer.lineLength(at.line - 1);
		editor.buffer.lines[at.line - 1] += editor.buffer.lineText(at.line);
		editor.buffer.lines.splice(at.line, 1);
		editor.buffer.modified = true;
		editor.cursor.setExact(new Pos(at.line - 1, previous_length));
	}

	// every backspace path rests the cursor on the line it edited
	editor.afterEdit(editor.cursor.pos.line);
}

function insertMove(editor: Editor, key: string): void {
	const at = editor.cursor.pos;

	if (key === "<up>" && at.line > 0) {
		const target = Math.min(at.col, editor.buffer.lineLength(at.line - 1));
		editor.cursor.setExact(new Pos(at.line - 1, target));
		return;
	}

	if (key === "<down>" && at.line < editor.buffer.lineCount() - 1) {
		const target = Math.min(at.col, editor.buffer.lineLength(at.line + 1));
		editor.cursor.setExact(new Pos(at.line + 1, target));
		return;
	}

	if (key === "<left>" && at.col > 0) {
		editor.cursor.setExact(new Pos(at.line, at.col - 1));
		return;
	}

	if (key === "<right>" && at.col < editor.buffer.lineLength(at.line)) {
		editor.cursor.setExact(new Pos(at.line, at.col + 1));
	}
}

/**
 * Exits insert or replace mode: duplicates the typed segment for counted
 * inserts (3o, 3i), records the repeat, and rests the cursor on the last
 * inserted character.
 */
export function endSession(editor: Editor): void {
	const session = editor.session;

	if (session === null) {
		editor.mode = "normal";
		return;
	}

	const end = editor.cursor.pos;

	// the cursor may have moved above the session start by mouse or arrow;
	// only the span from the start forward is a repeatable insertion
	const changed = end.before(session.start);
	const text = changed ? "" : editor.buffer.textOf(new Range(session.start, end, false));
	const extra = duplicatedText(text, session.count, session.location);

	let final = end;

	if (extra.length > 0) {
		editor.buffer.insert(end, extra);
		final = end.advancedBy(extra);
	}

	editor.mode = "normal";
	editor.session = null;
	editor.afterEdit(end.line);

	// the cursor rests on the last inserted character. A session that
	// only deleted, or typed nothing, stays where the edits left it --
	// real vi does not rewind to the session start
	const resting = text.length > 0 ? final.withCol(Math.max(0, final.col - 1)) : end;

	editor.cursor.setExact(resting);
	editor.clampCursor();

	if (session.replace) {
		editor.repeat_last = { kind: "replace_text", count: session.count, text };
		return;
	}

	if (session.change_base !== null) {
		const { sugar, ...base } = session.change_base;
		const repeated: Repeat =
			sugar === undefined
				? { kind: "change", ...base, text }
				: { kind: "sugar_change", key: sugar, count: base.count, register: base.register, text };

		editor.repeat_last = repeated;
		return;
	}

	editor.repeat_last = { kind: "insert", location: session.location, count: session.count, text };
}

// types text into the active insert session, used by repeat
export function typeText(editor: Editor, text: string): void {
	for (const ch of text) {
		insertKey(editor, ch === "\n" ? "enter" : ch);
	}
}

// re-opens an insert session and types text, used by repeat
export function performInsert(
	editor: Editor,
	location: InsertLocation,
	count: number,
	text: string
): void {
	startSession(editor, location, count, false);
	typeText(editor, text);
	endSession(editor);
}
