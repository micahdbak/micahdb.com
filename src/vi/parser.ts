import type { MotionDescription } from "./motions/types.ts";

export type OperatorName = "d" | "c" | "y" | "<" | ">" | "gu" | "gU" | "g~";

export type OperatorCommand = {
	kind: "operator";
	operator: OperatorName;
	motion: MotionDescription | null;
	linewise: boolean;
	count: number;
	register?: string;
};

export type SimpleCommand = {
	kind: "simple";
	key: string;
	count: number;
	char?: string;
	register?: string;
};

export type ParsedCommand =
	| { kind: "motion"; motion: MotionDescription }
	| OperatorCommand
	| SimpleCommand
	| { kind: "command_line"; prompt: string }
	| { kind: "invalid" };

export type Pending = {
	count1: number | null;
	count2: number | null;
	operator: OperatorName | null;
	register: string | null;
	register_pending: boolean;
	g_pending: boolean;
	char_command: string | null;
	mark_mode: "'" | "`" | null;
};

const OPERATOR_KEYS = new Set(["d", "c", "y", "<", ">"]);
const CHAR_MOTIONS = new Set(["f", "F", "t", "T"]);
const SIMPLE_KEYS = new Set([
	"x", "X", "D", "C", "s", "S", "~", "J", "p", "P", "u", "U", ".", "R", "i", "I", "a", "A", "o", "O",
]);
const PAGING_KEYS = new Set(["<c-f>", "<c-b>", "<c-d>", "<c-u>"]);
const MOTION_KEYS = new Set([
	"h", "l", "w", "W", "b", "B", "e", "E", "%", "(", ")", "{", "}",
	"G", "+", "-", "|", "^", "$", "0", "j", "k", "n", "N", "enter", ";", ",",
]);
const ARROW_MOTIONS: Record<string, string> = {
	"<up>": "k", "<down>": "j", "<left>": "h", "<right>": "l", "<bs>": "h",
};

function fresh(): Pending {
	return {
		count1: null,
		count2: null,
		operator: null,
		register: null,
		register_pending: false,
		g_pending: false,
		char_command: null,
		mark_mode: null,
	};
}

// the key a doubled operator repeats: guu doubles gu
function operatorBaseKey(operator: OperatorName): string {
	if (operator === "gu") {
		return "u";
	}

	if (operator === "gU") {
		return "U";
	}

	if (operator === "g~") {
		return "~";
	}

	return operator;
}

function addCount(count: number | null, key: string): number {
	return Math.min(1_000_000, (count ?? 0) * 10 + Number(key));
}

type MotionCount = number | null;

/**
 * Count1/count2 are the pre- and post-operator counts; the effective count
 * is count2 ?? count1 ?? 0
 */
function motionDescription(
	name: string,
	count1: MotionCount,
	count2: MotionCount,
	char?: string
): MotionDescription {
	return { name, char, count: count2 ?? count1 ?? 0 };
}

/**
 * Effective motion count: count1 x count2, except G whose count is a line
 * number and never multiplies.
 */
function effectiveCount(motion: MotionDescription, count1: MotionCount): number {
	if (motion.name === "G") {
		return motion.count !== 0 ? motion.count : count1 ?? 0;
	}

	return motion.count === 0 ? count1 ?? 1 : motion.count * (count1 ?? 1);
}

function operatorCommand(
	state: Pending,
	motion: MotionDescription | null,
	linewise: boolean
): OperatorCommand {
	return {
		kind: "operator",
		operator: state.operator ?? "d",
		motion: motion === null ? null : { ...motion, count: effectiveCount(motion, state.count1) },
		linewise,
		count: state.count1 ?? 1,
		register: state.register ?? undefined,
	};
}

type FeedResult = { pending: Pending | null; command: ParsedCommand | null };

/**
 * The count the motion sees: before the operator when the operator is
 * absent, after it otherwise (the operator step multiplies them)
 */
function pendingCount(state: Pending): number | null {
	return state.operator === null ? state.count1 : state.count2;
}

/**
 * Feed one keystroke into the normal-mode command state machine.
 *
 * A complete command comes back with the pending state cleared, an
 * incomplete one keeps the state for the next call, and a malformed one
 * comes back as `{ kind: "invalid" }`.
 */
export function feed(pending: Pending | null, key: string): FeedResult {
	const state = pending ?? fresh();

	if (key === "esc") {
		return { pending: null, command: null };
	}

	// a char argument completes f/F/t/T/r/m and the mark commands
	if (state.char_command !== null) {
		const command = state.char_command;

		// m and r are not motions: an operator before them is an error
		if ((command === "m" || command === "r") && state.operator !== null) {
			return { pending: null, command: { kind: "invalid" } };
		}

		if (command === "m") {
			return /^[a-z]$/.test(key)
				? { pending: null, command: { kind: "simple", key: "m", count: state.count1 ?? 1, char: key } }
				: { pending: null, command: { kind: "invalid" } };
		}

		if (CHAR_MOTIONS.has(command)) {
			const motion = motionDescription(command, null, pendingCount(state), key);

			return state.operator === null
				? { pending: null, command: { kind: "motion", motion } }
				: { pending: null, command: operatorCommand(state, motion, false) };
		}

		return {
			pending: null,
			command: {
				kind: "simple",
				key: "r",
				count: state.count1 ?? 1,
				char: key,
				register: state.register ?? undefined,
			},
		};
	}

	if (state.mark_mode !== null) {
		const mark_mode = state.mark_mode;

		if (!/^[a-z'`]$/.test(key)) {
			return { pending: null, command: { kind: "invalid" } };
		}

		// '' and `` jump to the last jump position
		const last_jump = key === "'" || key === "`";
		const name = mark_mode === "'" && !last_jump ? "mark_line" : "mark_exact";
		const char = last_jump ? undefined : key;
		const motion = motionDescription(name, null, pendingCount(state), char);

		return state.operator === null
			? { pending: null, command: { kind: "motion", motion } }
			: { pending: null, command: operatorCommand(state, motion, false) };
	}

	if (state.register_pending) {
		if (!/^[a-z0-9]$/.test(key)) {
			return { pending: null, command: { kind: "invalid" } };
		}

		return { pending: { ...state, register: key, register_pending: false }, command: null };
	}

	// digits accumulate the active count; a lone 0 is a motion
	if (/^[1-9]$/.test(key) || (key === "0" && (state.count1 !== null || state.count2 !== null))) {
		const field = state.operator === null ? "count1" : "count2";
		const counted = { ...state, [field]: addCount(state[field], key) };

		return { pending: counted, command: null };
	}

	if (state.g_pending) {
		if (key === "e" || key === "E") {
			const motion = motionDescription(`g${key}`, null, pendingCount(state));

			return state.operator === null
				? { pending: null, command: { kind: "motion", motion } }
				: { pending: null, command: operatorCommand(state, motion, false) };
		}

		if ((key === "u" || key === "U" || key === "~") && state.operator === null) {
			const operator: OperatorName = key === "u" ? "gu" : key === "U" ? "gU" : "g~";
			return { pending: { ...state, g_pending: false, operator }, command: null };
		}

		return { pending: null, command: { kind: "invalid" } };
	}

	// a pending operator doubles on its own key for a linewise range
	if (state.operator !== null && key === operatorBaseKey(state.operator)) {
		return { pending: null, command: operatorCommand(state, null, true) };
	}

	if (state.operator === null && OPERATOR_KEYS.has(key)) {
		return { pending: { ...state, operator: key as OperatorName }, command: null };
	}

	if (state.operator === null && key === "g") {
		return { pending: { ...state, g_pending: true }, command: null };
	}

	const arrow_motion = ARROW_MOTIONS[key];

	if (MOTION_KEYS.has(key) || arrow_motion !== undefined) {
		const name = arrow_motion ?? key;

		// count1 stays out of the motion: the operator step multiplies it in
		const count = state.operator === null ? state.count1 : null;
		const motion = motionDescription(name, count, state.count2);

		return state.operator === null
			? { pending: null, command: { kind: "motion", motion } }
			: { pending: null, command: operatorCommand(state, motion, false) };
	}

	if (CHAR_MOTIONS.has(key) || key === "m" || key === "r") {
		return { pending: { ...state, char_command: key }, command: null };
	}

	if (key === "'" || key === "`") {
		return { pending: { ...state, mark_mode: key }, command: null };
	}

	if (key === '"') {
		return { pending: { ...state, register_pending: true }, command: null };
	}

	if (SIMPLE_KEYS.has(key) || PAGING_KEYS.has(key)) {
		return {
			pending: null,
			command: {
				kind: "simple",
				key,
				count: state.count1 ?? 1,
				register: state.register ?? undefined,
			},
		};
	}

	if (key === ":" || key === "/" || key === "?") {
		return { pending: null, command: { kind: "command_line", prompt: key } };
	}

	return { pending: null, command: { kind: "invalid" } };
}
