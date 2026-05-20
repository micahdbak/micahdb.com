import { fromMarkdown } from "mdast-util-from-markdown";
import type { Node, Parent } from "mdast";
import type { Text, Heading, Link as MdastLink } from "mdast";

import { Link } from "./link.ts";
import { Glyph, Terminal } from "../terminal.ts";

class Markdown {
	private static readonly SECTION_TYPES = [
		"break",
		"code",
		"heading",
		"list",
		"listItem",
		"paragraph"
	];

	private terminal: Terminal;
	private root: Node;

	constructor(terminal: Terminal, markdown: string) {
		this.terminal = terminal;
		this.root = fromMarkdown(markdown);
		console.log(this.root);
	}

	draw(row: number, col: number, cols: number) {
		if (row < 0 || col < 0 || cols <= 0) {
			return;
		}

		// tree traversal tracking
		const stack: Parent[] = [this.root];
		const indexes: number[] = [0];
		const fonts: number[] = [Glyph.NORMAL_FONT];
		let depth = 0;

		// text drawing settings
		let r = row - 2; // first section will increment by 2
		let c = col;
		let bg = 16;
		let fg = 17;

		// lists
		let list_idx = 0;
		let list_content_flag = false;

		while (stack.length > 0) {
			const parent = stack[depth];
			const idx = indexes[depth];

			if (idx >= parent.children.length) {
				stack.pop();
				indexes.pop();
				fonts.pop();
				depth--;

				continue;
			}

			let node = parent.children[idx] as Node;
			indexes[depth] = idx + 1;

			if (!node) {
				continue;
			}

			const is_list_content = node.type === "paragraph" && list_content_flag;

			if (is_list_content) {
				// unset flag; this paragraph composes the list
				list_content_flag = false;
			}

			if (Markdown.SECTION_TYPES.includes(node.type) && !is_list_content) {
				r += node.type.startsWith("list") ? 1 : 2;
				c = col;
			}

			const is_link = node.type === "link";
			const link_url: string = is_link ? (node as MdastLink).url : "";

			if (is_link) {
				node = (node as MdastLink).children[0] as Node; // pray this is Text
			}

			let font = fonts[depth];
			const is_normal_font = font === Glyph.NORMAL_FONT;

			if ("children" in node) {
				switch (node.type) {
					case "heading":
						const heading = node as Heading;
						this.terminal.drawText("#".repeat(heading.depth), r, c, 16, 8);
						c += heading.depth + 1;
						break;

					case "list":
						list_idx = 1;
						break;

					case "listItem":
						const text = `${list_idx < 10 ? " " : ""}${list_idx++}. `;
						this.terminal.drawText(text, r, c, 16, 8);
						c += text.length;
						list_content_flag = true; // waiting for list content
						break;

					case "emphasis":
						font = is_normal_font ? Glyph.ITALIC_FONT : Glyph.ITALIC_BOLD_FONT;
						break;

					case "strong":
						font = is_normal_font ? Glyph.BOLD_FONT : Glyph.ITALIC_BOLD_FONT;
						break;
				}

				stack.push(node as Parent);
				indexes.push(0);
				fonts.push(font); // trickle down
				depth++;

				continue;
			}

			if (node.type !== "text") {
				// this shouldn't exist - but good to check
				continue;
			}

			let text = (node as Text).value;
			text = text.replace(/\s+/g, " ");

			if (is_link) {
				Link.draw(this.terminal, text, link_url, r, c);
				c += text.length;

				if (c > col + cols) {
					r++;
					c = col;
				}

				continue;
			}

			const words: string[] = text.split(" ");

			for (let i = 0; i < words.length; i++) {
				let word: string = i === words.length - 1 ? words[i] : words[i] + " ";

				// calculate visible length for wrapping
				const visible_word = word.replace(/&(\d{1,2})(.)?;/g, ""); // e.g., "&10b;" for bg, "&1;" for fg
				const visible_len = visible_word.trimEnd().length;

				if (visible_len <= cols && c + visible_len > col + cols) {
					// move to next row
					r++;
					c = col;
				}

				while (true) {
					const match = word.match(/&(\d{1,2})(.)?;/); // same as above, non-global

					if (!match) {
						// no more settings - draw word directly
						if (word.length > 0) {
							this.terminal.drawText(word, r, c, bg, fg, 0, 0, false, font);
							c += word.length;
						}

						break;
					}

					// prefix uses existing bg/fg
					const prefix = word.substring(0, match.index);

					if (prefix.length > 0) {
						this.terminal.drawText(prefix, r, c, bg, fg, 0, 0, false, font);
						c += prefix.length;
					}

					// update colors
					if (match[2] === "b") {
						bg = parseInt(match[1]);
					} else {
						fg = parseInt(match[1]);
					}

					word = word.substring(match.index + match[0].length);
				}
			}
		}
	}
}

export { Markdown };
