import { searchNext, SEARCH_NOT_FOUND } from "../search.ts";
import { executeEx } from "../ex.ts";
import type { Editor } from "./editor.ts";

export function commandLineKey(editor: Editor, key: string): void {
	const command_line = editor.command_line;

	if (command_line === null) {
		editor.mode = "normal";
		return;
	}

	if (key === "esc") {
		editor.command_line = null;
		editor.mode = "normal";
		return;
	}

	if (key === "enter") {
		const text = command_line.text;
		const prompt = command_line.prompt;
		editor.command_line = null;
		editor.mode = "normal";

		// one history, shared between : and the search prompts
		if (text.trim() !== "") {
			editor.history.push(text);
		}

		if (prompt === ":") {
			executeEx(editor, text);
			return;
		}

		doSearch(editor, text, prompt === "/");
		return;
	}

	if (key === "<bs>") {
		// backspace on an empty command line cancels it
		if (command_line.text === "") {
			editor.command_line = null;
			editor.mode = "normal";
			return;
		}

		command_line.text = command_line.text.slice(0, -1);
		return;
	}

	if (key === "<up>" || key === "<down>") {
		walkHistory(editor, key === "<up>" ? -1 : 1);
		return;
	}

	if (key.length === 1) {
		command_line.text += key;
	}
}

function walkHistory(editor: Editor, step: number): void {
	if (editor.history.length === 0 || editor.command_line === null) {
		return;
	}

	const base = editor.history_index ?? editor.history.length;
	const index = base + step;

	if (index >= editor.history.length) {
		editor.history_index = null;
		editor.command_line.text = "";
		return;
	}

	editor.history_index = Math.max(0, index);
	editor.command_line.text = editor.history[editor.history_index] ?? "";
}

/**
 * / and ?: literal search with wrap-around; an empty prompt repeats the
 * last pattern.
 */
function doSearch(editor: Editor, text: string, forward: boolean): void {
	const pattern = text === "" ? editor.search.pattern : text;

	if (pattern === "") {
		return;
	}

	editor.search = { pattern, forward };
	const found = searchNext(editor.buffer, editor.cursor.pos, pattern, forward);

	if (found === null) {
		editor.flash(SEARCH_NOT_FOUND + pattern);
		return;
	}

	const here = editor.cursor.pos.line;
	const wrapped = forward ? found.line < here : found.line > here;

	editor.last_jump = editor.cursor.pos;
	editor.cursor.setExact(found);

	if (wrapped) {
		const from = forward ? "BOTTOM" : "TOP";
		const to = forward ? "TOP" : "BOTTOM";

		editor.flash(`search hit ${from}, continuing at ${to}`);
	}
}
