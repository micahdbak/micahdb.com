// the visible window over the display rows; it follows the vi cursor, and
// the mouse wheel moves the cursor rather than scrolling directly
export class Viewport {
	top = 0;

	update(content_rows: number, screen_rows: number): void {
		this.clamp(content_rows, screen_rows);
	}

	// minimal scrolling so the cursor stays on screen
	follow(cursor_row: number, content_rows: number, screen_rows: number): void {
		const usable = Math.max(1, screen_rows - 1);

		if (cursor_row < this.top) {
			this.top = cursor_row;
		}

		if (cursor_row > this.top + usable - 1) {
			this.top = cursor_row - usable + 1;
		}

		this.clamp(content_rows, screen_rows);
	}

	private clamp(content_rows: number, screen_rows: number): void {
		const max_top = Math.max(0, content_rows - Math.max(1, screen_rows - 2));
		this.top = Math.max(0, Math.min(max_top, this.top));
	}
}
