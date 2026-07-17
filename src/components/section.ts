import { Glyphs, textGlyphs } from "@/glyphs.ts";
import { Terminal } from "@/terminal.ts";

enum SectionState {
	NOT_HOVERED = 1,
	HOVERED = 2,
	JUST_ANCHORED = 3,
	ANCHORED = 4
}

export class Section {
	private terminal: Terminal;
	private text: string;
	private anchor: string;

	private state: null | SectionState;
	private anchored_when: number;

	public glyphs: Glyphs;

	constructor(terminal: Terminal, text: string, anchor: string) {
		this.terminal = terminal;
		this.text = text;
		this.anchor = anchor;

		this.state = null;
		this.anchored_when = -1000;
	}

	update(row: number, col: number) {
		// note: + 2 is for the string " ¶" to be included in the hover
		const is_hovered = this.terminal.canvas.mouseAt(row, col, 1, this.text.length + 2);
		const was_hovered = this.terminal.canvas.mouseDownAt(row, col, 1, this.text.length + 2);
		let is_anchored = window.location.hash === this.anchor;

		if (is_hovered && was_hovered && this.terminal.canvas.mouse_click) {
			if (is_anchored) {
				// click again clears the anchor
				window.location.hash = "";
				is_anchored = false;
			} else {
				window.location.hash = this.anchor;

				try {
					// copy URL to this section
					void navigator.clipboard.writeText(window.location.origin + this.anchor);
				} catch {
					// ignore
				}
			}
		} else if (is_hovered) {
			this.terminal.canvas.class_name = "pointer";

			const detail = window.location.origin + this.anchor;
			this.terminal.detail_text = " Link: " + detail + " ";
		}

		let anchor_state = SectionState.ANCHORED;

		if (is_anchored) {
			const now = performance.now();
			anchor_state = SectionState.ANCHORED;

			if (this.anchored_when === null) {
				this.anchored_when = now;
				anchor_state = SectionState.JUST_ANCHORED;
			} else {
				const delta = now - this.anchored_when;

				if (delta < 1000) {
					anchor_state = SectionState.JUST_ANCHORED;
				}
			}
		} else if (this.anchored_when !== null) {
			this.anchored_when = null;
		}

		const new_state = is_anchored
			? anchor_state
			: is_hovered
				? SectionState.HOVERED
				: SectionState.NOT_HOVERED;

		if (new_state !== this.state) {
			this.state = new_state;

			let section_title = this.text;
			let len = this.text.length;

			const format = "\\F7\\b0";
			let pilcrow = "  ";

			if (new_state === SectionState.JUST_ANCHORED) {
				const copy_text = "COPIED URL";

				let spaces = this.text.length - copy_text.length;

				if (spaces < 0) {
					spaces = 0;
				}

				section_title = "\\F2" + copy_text + " ".repeat(spaces);
				len = copy_text.length + spaces;
				pilcrow = " \\F7¶";
			} else if (new_state === SectionState.ANCHORED) {
				pilcrow = " \\F7¶";
			} else if (new_state === SectionState.HOVERED) {
				pilcrow = " \\F0¶";
			}

			const text = format + section_title + pilcrow;

			this.glyphs = textGlyphs(text, len + 2, false);
		}
	}
}
