import { describe, expect, test } from "bun:test";

import type { MotionDescription } from "./motions/types.ts";
import { feed } from "./parser.ts";
import type { ParsedCommand, Pending } from "./parser.ts";

type Complete = { pending: Pending | null; command: ParsedCommand | null };

function typeKeys(...keys: string[]): Complete {
	let pending: Pending | null = null;
	let last: Complete = { pending: null, command: null };

	for (const key of keys) {
		last = feed(pending, key);

		if (last.command !== null && last.command.kind !== "invalid") {
			pending = null;
			continue;
		}

		pending = last.pending;
	}

	return last;
}

function motionOf(result: Complete): MotionDescription {
	const command = result.command;

	if (command === null || command.kind !== "motion") {
		throw new Error("expected a motion command");
	}

	return command.motion;
}

describe("command parser", () => {
	test("a plain motion passes through", () => {
		const result = typeKeys("w");
		expect(motionOf(result)).toEqual({ name: "w", char: undefined, count: 0 });
	});

	test("counts accumulate before a motion", () => {
		const result = typeKeys("3", "w");
		expect(motionOf(result)).toEqual({ name: "w", char: undefined, count: 3 });
	});

	test("a lone 0 is a motion, not a count", () => {
		const result = typeKeys("0");
		expect(motionOf(result)).toEqual({ name: "0", char: undefined, count: 0 });
	});

	test("2d3w multiplies the counts onto the motion", () => {
		const result = typeKeys("2", "d", "3", "w");

		expect(result.command).not.toBeNull();
		const command = result.command!;

		expect(command.kind).toBe("operator");
		expect((command as { operator: string }).operator).toBe("d");
		const motion = (command as { motion: MotionDescription | null }).motion;

		expect(motion).toEqual({ name: "w", char: undefined, count: 6 });
	});

	test("doubled operators are linewise", () => {
		const result = typeKeys("d", "d");

		expect(result.command).not.toBeNull();
		expect((result.command as { kind: string }).kind).toBe("operator");
		expect((result.command as { linewise: boolean }).linewise).toBe(true);
	});

	test("char motions compose with operators and counts", () => {
		const result = typeKeys("d", "2", "f", "x");

		expect(result.command).not.toBeNull();
		const command = result.command!;

		expect(command.kind).toBe("operator");
		expect((command as { operator: string }).operator).toBe("d");
		const motion = (command as { motion: MotionDescription | null }).motion;

		expect(motion).toEqual({ name: "f", char: "x", count: 2 });
	});

	test("r waits for its replacement character", () => {
		const result = typeKeys("3", "r", "x");
		const command = result.command as { kind: string; key: string; count: number; char?: string };

		expect(command.kind).toBe("simple");
		expect(command.key).toBe("r");
		expect(command.count).toBe(3);
		expect(command.char).toBe("x");
	});

	test("an operator before r or m is invalid", () => {
		expect(typeKeys("d", "r", "x").command?.kind).toBe("invalid");
		expect(typeKeys("d", "m", "a").command?.kind).toBe("invalid");
	});

	test("a count before ge multiplies", () => {
		const result = typeKeys("3", "g", "e");
		expect(motionOf(result)).toEqual({ name: "ge", char: undefined, count: 3 });
	});

	test("register prefix routes to the operator", () => {
		const result = typeKeys('"', "a", "y", "y");

		expect((result.command as { register?: string }).register).toBe("a");
		expect((result.command as { operator: string }).operator).toBe("y");
	});

	test("g opens the g-prefixed operators and motions", () => {
		const guw = typeKeys("g", "u", "w");
		expect((guw.command as { operator: string }).operator).toBe("gu");

		const ge = typeKeys("g", "e");
		expect((ge.command as { motion: MotionDescription }).motion.name).toBe("ge");
	});

	test("esc cancels a pending command", () => {
		const started = typeKeys("d");
		const pending_state = started.pending!;

		const result = feed(pending_state, "esc");

		expect(result.pending).toBeNull();
		expect(result.command).toBeNull();
	});

	test("marks wait for a label", () => {
		const marked = typeKeys("m", "a");
		expect((marked.command as { key: string; char?: string }).key).toBe("m");
		expect((marked.command as { char?: string }).char).toBe("a");

		const jumped = typeKeys("'", "a");
		expect((jumped.command as { motion: MotionDescription }).motion.name).toBe("mark_line");

		const exact = typeKeys("`", "a");
		expect((exact.command as { motion: MotionDescription }).motion.name).toBe("mark_exact");
	});

	test("arrows map onto motions", () => {
		const result = typeKeys("<up>");
		expect((result.command as { motion: MotionDescription }).motion.name).toBe("k");
	});

	test("unknown keys are invalid", () => {
		const result = typeKeys("@");
		expect((result.command as { kind: string }).kind).toBe("invalid");
	});

	test("command_line keys open the command line", () => {
		const result = typeKeys(":");
		expect((result.command as { kind: string; prompt: string }).kind).toBe("command_line");
	});
});
