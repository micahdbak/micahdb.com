import type { Pos } from "../buffer.ts";
import type { MotionDescription } from "../motions/types.ts";
import type { OperatorName } from "../parser.ts";

export type Mode = "normal" | "insert" | "replace" | "command_line";

export type CommandLine = { prompt: string; text: string };

export type ViewportState = { top: number; rows: number };

export type InsertLocation =
	| "insert"
	| "append"
	| "line_start"
	| "append_eol"
	| "open_below"
	| "open_above";

/**
 * The operator fields a change replays; ChangeBase adds where the change
 * came from a sugar command.
 */
export type OperatorRepeat = {
	operator: OperatorName;
	motion: MotionDescription | null;
	linewise: boolean;
	count: number;
	register?: string;
};

export type ChangeBase = OperatorRepeat & { sugar?: string };

export type Session = {
	location: InsertLocation;
	count: number;
	start: Pos;
	replace: boolean;
	change_base: ChangeBase | null;
};

/**
 * What . re-executes: an operator command, a change with its typed text, a
 * counted insert session, a replace-mode run, or a sugar command like x.
 */
export type Repeat =
	| ({ kind: "operator" } & OperatorRepeat)
	| ({ kind: "change" } & OperatorRepeat & { text: string })
	| { kind: "sugar_change"; key: string; count: number; register?: string; text: string }
	| { kind: "insert"; location: InsertLocation; count: number; text: string }
	| { kind: "replace_text"; count: number; text: string }
	| { kind: "repeat_simple"; key: string; count: number; char?: string; register?: string };
