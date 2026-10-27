import { Pos } from "./buffer.ts";

/**
 * The vi cursor: a buffer position plus the sticky column that vertical
 * movements restore, as when 10j follows $.
 */
export class Cursor {
	pos: Pos;
	sticky: number | null;

	constructor(line = 0, col = 0) {
		this.pos = new Pos(line, col);
		this.sticky = null;
	}

	setExact(position: Pos): void {
		this.pos = position;
		this.sticky = null;
	}
}
