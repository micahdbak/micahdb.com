import { performInsert, startSession, typeText, endSession } from "./insert.ts";
import { applyOperatorRange, doOperatorCommand, doSimple, startSugarChange } from "./normal.ts";
import { sugarRange } from "../operators.ts";
import type { Editor } from "./editor.ts";
import type { OperatorCommand } from "../parser.ts";

// .: re-executes the last change at the current cursor position
export function repeatCommand(editor: Editor): void {
	const last = editor.repeat_last;

	if (last === null) {
		return;
	}

	switch (last.kind) {
		case "operator": {
			doOperatorCommand(editor, last);
			return;
		}

		case "change": {
			const command: OperatorCommand = {
				kind: "operator",
				operator: last.operator,
				motion: last.motion,
				linewise: last.linewise,
				count: last.count,
				register: last.register,
			};

			doOperatorCommand(editor, command);

			if (editor.mode === "insert" && editor.session !== null) {
				editor.session.change_base = null;
				typeText(editor, last.text);
				endSession(editor);
			}

			editor.repeat_last = last;
			return;
		}

		case "sugar_change": {
			const range = sugarRange(editor.buffer, editor.cursor.pos, last.count, last.key);

			if (range === null) {
				return;
			}

			const kind = last.key === "S" ? "linewise" : "exclusive";

			applyOperatorRange(editor, "c", range, kind, last.register);
			startSugarChange(editor, last.key, last.count, last.register);
			typeText(editor, last.text);
			endSession(editor);
			return;
		}

		case "insert": {
			performInsert(editor, last.location, last.count, last.text);
			editor.repeat_last = last;
			return;
		}

		case "replace_text": {
			startSession(editor, "insert", last.count, true);
			typeText(editor, last.text);
			endSession(editor);
			editor.repeat_last = last;
			return;
		}

		case "repeat_simple": {
			doSimple(editor, {
				kind: "simple",
				key: last.key,
				count: last.count,
				char: last.char,
				register: last.register,
			});

			editor.repeat_last = last;
			return;
		}
	}
}
