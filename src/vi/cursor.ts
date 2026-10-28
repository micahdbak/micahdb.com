import { Pos } from "./buffer.ts";

/**
 * The vi cursor: a buffer position plus the sticky column that vertical
 * movements restore, as when 10j follows $.
 */
export class Cursor {
	pos: Pos;
	sticky: number | null;

	constructor() {
		this.pos = new Pos(0, 0);
		this.sticky = null;
	}

	setExact(position: Pos): void {
		this.pos = position;
		this.sticky = null;
	}
}
