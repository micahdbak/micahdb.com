import { Pos, Range } from "./buffer.ts";
import type { Editor } from "./editor/editor.ts";

const MESSAGES = {
	w: "Saved. (To where? There's no disk. Trust me.)",
	q: "Nowhere to go. You're here forever.",
	wq: "Saved and quit. Wait-- you can't quit. You're still here.",
} as const;

// splits on the separator, treating \/ as a literal slash
function splitEscaped(text: string, separator: string): string[] {
	const parts: string[] = [];
	let current = "";

	for (let index = 0; index < text.length; index++) {
		const ch = text[index];

		if (ch === "\\" && text[index + 1] === separator) {
			current += separator;
			index++;
			continue;
		}

		if (ch === separator) {
			parts.push(current);
			current = "";
			continue;
		}

		current += ch;
	}

	parts.push(current);
	return parts;
}

function gotoLine(editor: Editor, target: string): void {
	const buffer = editor.buffer;
	const from = editor.cursor.pos;

	let line: number;

	if (target === "$") {
		line = buffer.lineCount() - 1;
	} else if (target.startsWith("+") || target.startsWith("-")) {
		const offset = target === "+" || target === "-" ? 1 : Number(target);
		line = from.line + offset;
	} else {
		line = Number(target) - 1;
	}

	const clamped = Math.max(0, Math.min(buffer.lineCount() - 1, line));
	editor.last_jump = from;
	editor.placeCursor(buffer.firstNonBlank(clamped));
}

function exLineCount(args: string): number {
	return Number(args.trim() || "1") || 1;
}

function exLinesRange(editor: Editor, args: string): Range {
	const from = editor.cursor.pos.line;
	const to = Math.min(editor.buffer.lineCount() - 1, from + exLineCount(args) - 1);

	return new Range(new Pos(from, 0), new Pos(to, 0), true);
}

function exDelete(editor: Editor, args: string): void {
	editor.deleteRange(exLinesRange(editor, args));
}

function exYank(editor: Editor, args: string): void {
	editor.yankRange(exLinesRange(editor, args));
}

function exSubstitute(editor: Editor, args: string, whole_file: boolean): void {
	if (!args.startsWith("/")) {
		editor.flash("E486: Pattern not found");
		return;
	}

	const [old_text = "", new_text = "", flags = ""] = splitEscaped(args.slice(1), "/");
	const all = flags.includes("g");
	const pattern = old_text === "" ? editor.search.pattern : old_text;

	if (pattern === "") {
		editor.flash("E35: No previous regular expression");
		return;
	}

	const buffer = editor.buffer;
	const from = whole_file ? 0 : editor.cursor.pos.line;
	const to = whole_file ? buffer.lineCount() - 1 : editor.cursor.pos.line;
	const changed_lines: [number, string][] = [];

	for (let line = from; line <= to; line++) {
		const text = buffer.lineText(line);
		let changed = text;

		if (all) {
			changed = text.split(pattern).join(new_text);
		} else {
			const index = text.indexOf(pattern);

			if (index !== -1) {
				changed = text.slice(0, index) + new_text + text.slice(index + pattern.length);
			}
		}

		if (changed !== text) {
			changed_lines.push([line, changed]);
		}
	}

	if (changed_lines.length === 0) {
		editor.flash("E486: Pattern not found: " + pattern);
		return;
	}

	editor.rememberState();

	for (const [line, changed] of changed_lines) {
		buffer.lines[line] = changed;
	}

	buffer.modified = true;
	editor.afterEdit(from);
	editor.flash(`${changed_lines.length} substitution${changed_lines.length === 1 ? "" : "s"}`);
}

export function executeEx(editor: Editor, command: string): void {
	const text = command.trim();

	if (text === "") {
		return;
	}

	if (/^\d+$/.test(text) || text === "$" || /^[+-]\d*$/.test(text)) {
		gotoLine(editor, text);
		return;
	}

	if (/^(%?)s\//.test(text)) {
		exSubstitute(editor, text.slice(text[0] === "%" ? 2 : 1), text[0] === "%");
		return;
	}

	const [name, ...args] = text.split(/\s+/);

	switch (name) {
		case "w":
			editor.buffer.modified = false;
			editor.flash(MESSAGES.w);
			return;

		case "q":
		case "q!":
			editor.flash(MESSAGES.q);
			return;

		case "wq":
			editor.buffer.modified = false;
			editor.flash(MESSAGES.wq);
			return;

		case "d":
			exDelete(editor, args.join(" "));
			return;

		case "y":
			exYank(editor, args.join(" "));
			return;

		case "pu":
		case "put":
			editor.putRange();
			return;
	}

	editor.flash("E492: Not an editor command: " + text);
}
