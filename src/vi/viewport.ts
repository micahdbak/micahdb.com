/**
 * The visible window over the display rows. It follows the vi cursor when
 * the cursor moves and can be panned directly, which leaves a stationary
 * cursor where it is.
 */
export class Viewport {
	top = 0;

	private followed_row: number | null = null;

	update(content_rows: number, screen_rows: number): void {
		this.clamp(content_rows, screen_rows);
	}

	// absolute scroll, clamped to the document; used by drag panning
	scrollTo(row: number, content_rows: number, screen_rows: number): void {
		this.top = row;
		this.clamp(content_rows, screen_rows);
	}

	// after a reflow or resize the cursor's display row is new, so follow it
	resetFollow(): void {
		this.followed_row = null;
	}

	// remember the cursor's row without scrolling to it, for panning
	holdCursor(cursor_row: number): void {
		this.followed_row = cursor_row;
	}

	// minimal scrolling so the cursor stays on screen, once per new row
	follow(cursor_row: number, content_rows: number, screen_rows: number): void {
		if (cursor_row === this.followed_row) {
			return;
		}

		this.followed_row = cursor_row;

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
