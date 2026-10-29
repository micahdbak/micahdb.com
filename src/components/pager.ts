import * as tscon from "@micahdb/tscon";

export class Pager {
	private static readonly NAME = "pager"; // for mouse_owner
	private static readonly STATUS_HELP = "Wheel, drag, [jk|↓↑] to scroll";

	private readonly terminal: tscon.Terminal;

	private wheel_rows: number;

	private drag: {
		start_row: number;
		start_row_offset: number;
		last_row: number;
	} | null = null;

	private drag_velocity: number;

	private row_offset: number;

	private last_content_rows: number;
	private last_row: number;

	public row: number;

	public status_glyphs: tscon.Glyphs;

	constructor(terminal: tscon.Terminal) {
		this.terminal = terminal;

		this.wheel_rows = 0;

		this.drag_velocity = 0;

		this.row_offset = 0;

		this.last_row = 0;

		this.row = 0;

		this.last_content_rows = -1;

		this.status_glyphs = this.compileStatus(0);

		this.terminal.canvas.addEventListener("wheel", (event: Event) => {
			const detail = (event as CustomEvent).detail as { rows: number };
			this.wheel_rows += detail.rows;
		});
	}

	scrollToRow(row: number, content_rows: number) {
		if (row < 0 || row >= content_rows) {
			return;
		}

		this.wheel_rows = 0;
		this.drag_velocity = 0;

		this.row_offset = row;
		this.last_row = this.row;
		this.row = row;
		this.last_content_rows = content_rows;

		this.updateStatus(content_rows);
	}

	update(content_rows: number) {
		const max_offset = Math.max(0, content_rows - this.terminal.canvas.rows);

		if (Math.abs(this.wheel_rows) > 0) {
			if (!this.terminal.canvas.mouse_down) {
				this.row_offset += this.wheel_rows;
			}

			this.wheel_rows = 0;
			this.drag_velocity = 0;
		}

		if (this.terminal.canvas.mouse_down) {
			const { mouse_row } = this.terminal.canvas;

			// mouse_down implies a mouse position: canvas resets both together on resize
			if (mouse_row === undefined) {
				return;
			}

			if (this.terminal.canvas.mouse_owner === "") {
				this.terminal.canvas.mouse_owner = Pager.NAME;

				this.drag = {
					start_row: mouse_row,
					start_row_offset: Math.round(this.row_offset),
					last_row: mouse_row,
				};
			}

			if (this.terminal.canvas.mouse_owner === Pager.NAME && this.drag !== null) {
				const row_delta = mouse_row - this.drag.last_row;
				this.drag_velocity = Math.max(-2, Math.min(2, row_delta));
				this.drag.last_row = mouse_row;

				const drag_delta = mouse_row - this.drag.start_row;
				this.row_offset = this.drag.start_row_offset - drag_delta;
			}
		} else {
			if (this.terminal.canvas.mouse_owner === Pager.NAME) {
				this.terminal.canvas.mouse_owner = "";
				this.drag = null;
			}

			if (Math.abs(this.drag_velocity) > 0.01) {
				this.row_offset -= this.drag_velocity;
				this.drag_velocity *= 0.95;
			}
		}

		if (isNaN(this.row_offset)) {
			this.row_offset = 0;
		}

		this.row_offset = Math.max(0, Math.min(max_offset, this.row_offset));
		this.last_row = this.row;
		this.row = Math.round(this.row_offset);

		this.updateStatus(content_rows);

		this.last_content_rows = content_rows;
	}

	private updateStatus(content_rows: number) {
		if (this.last_row !== this.row || this.last_content_rows !== content_rows) {
			const max_offset = Math.max(0, content_rows - this.terminal.canvas.rows);
			let percent = 0;

			if (max_offset != 0) {
				percent = Math.round((this.row / max_offset) * 100);
			}

			this.status_glyphs = this.compileStatus(percent);
		}
	}

	private compileStatus(percent: number): tscon.Glyphs {
		const cols = ` ${Pager.STATUS_HELP} [${percent}%]:`.length;
		const status_text = `\\f0\\B7 ${Pager.STATUS_HELP} [${percent}%]\\F7\\b0:`;
		return new tscon.Glyphs(status_text, cols, { wrap: tscon.Wrap.TRUNCATE });
	}
}
