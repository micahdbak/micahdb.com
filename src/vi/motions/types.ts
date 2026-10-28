import type { Buffer, Pos } from "../buffer.ts";
import type { SearchState } from "../search.ts";
import type { DisplayRow, ScreenPos } from "../layout.ts";

export type MotionKind = "exclusive" | "inclusive" | "linewise";

export type MotionResult = { to: Pos; kind: MotionKind } | null;

export type MotionDescription = { name: string; char?: string; count: number };

export type CharSearch = { char: string; forward: boolean; before_target: boolean };

export type MotionResolver = (
	motion: MotionDescription,
	from: Pos,
	context: MotionContext
) => MotionResult;

// the slice of Layout that motion resolution is allowed to see
export type LayoutMotionView = {
	bufferToScreen(position: Pos): ScreenPos;
	bufferAtVisibleCol(line: number, row_in_line: number, col: number): Pos;
	displayRows: DisplayRow[];
	firstRowOfLine: number[];
};

export type MotionContext = {
	buffer: Buffer;
	layout: LayoutMotionView;
	marks: Map<string, Pos>;
	last_char_search: CharSearch | null;
	last_jump: Pos | null;
	search: SearchState;
	viewport_top: number;
	screen_rows: number;
};

const JUMP_MOTIONS = new Set([
	"G", "%", "(", ")", "{", "}", "H", "M", "L", "n", "N", "mark_exact", "mark_line",
]);

// motions that record the pre-jump position for '' and ``
export function isJumpMotion(name: string): boolean {
	return JUMP_MOTIONS.has(name);
}
