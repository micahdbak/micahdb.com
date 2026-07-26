import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { join, dirname, basename } from "node:path";

import { Colour, PALETTE } from "./colour.ts";
import { textToLines, TAB_WIDTH } from "./glyphs.ts";

const CONTENT_DIR = "src/pages/content";
const OUTPUT_DIR = "build/raw";
const COLS = 80;

const CSS_HEAD = `@font-face {
	font-family: "JetBrains Mono";
	src: url("/fonts/JetBrainsMono-Regular.ttf") format("truetype");
	font-weight: normal;
	font-style: normal;
	font-display: block;
}

html {
	margin: 0;
	padding: 0;
}

body {
	background-color: #080808;
	color: #f4f4f4;
	margin: 0;
	padding: 0;
}

pre {
	font-family: "JetBrains Mono", monospace;
	font-size: 14px;
	line-height: 1.2;
	margin: 0;
	padding: 1rem;
	white-space: pre;
}
`;

function reconcileSpans(
	open_spans: string[],
	desired: string[]
): {
	spans: string[];
	tags: string[];
} {
	let i = 0;
	while (i < open_spans.length && i < desired.length && open_spans[i] === desired[i]) {
		i++;
	}

	const tags: string[] = [];

	for (let j = open_spans.length; j > i; j--) {
		tags.push("</span>");
	}

	const spans = open_spans.slice(0, i);

	while (spans.length < desired.length) {
		const cls = desired[spans.length];
		spans.push(cls);
		tags.push(`<span class="${cls}">`);
	}

	return { spans, tags };
}

function escapeHtml(c: string): string {
	switch (c) {
		case "&":
			return "&amp;";
		case "<":
			return "&lt;";
		case ">":
			return "&gt;";
		default:
			return c;
	}
}

// converts formatted glyph text into HTML with minimal <span> usage
function textToHtml(text: string, cols: number, wrap: boolean): string {
	if (cols <= 0) {
		return "";
	}

	const lines = textToLines(text, cols, wrap);

	if (lines.length === 0) {
		return "";
	}

	const default_fg: number = Colour.WHITE;
	const default_bg: number = Colour.BLACK;

	let fg: number = default_fg;
	let bg: number = default_bg;

	let open_spans: string[] = [];

	const html: string[] = [];

	for (let row = 0; row < lines.length; row++) {
		const line = lines[row];
		let col = 0;

		for (let i = 0; i < line.length; i++) {
			const c = line[i];
			let escape = c === "\\";

			// \\ : display a single back slash
			if (escape && i + 1 < line.length && line[i + 1] === "\\") {
				i++;
				escape = false;
			}

			// ignore anchor escape sequences
			if (escape && i + 2 < line.length && line[i + 1] === "a" && !isNaN(Number(line[i + 2]))) {
				let skip_chars = 2;

				if (i + 3 < line.length && line[i + 3] === "{") {
					const closing_brace = line.indexOf("}", i + 3);

					if (closing_brace > i + 3) {
						skip_chars = closing_brace - i;
					}
				}

				i += skip_chars;

				continue;
			}

			// colour escape sequence
			if (
				escape &&
				i + 2 < line.length &&
				"fFbB".includes(line[i + 1]) &&
				!isNaN(Number(line[i + 2]))
			) {
				const num = Math.max(Math.min(Number(line[i + 2]), 7), 0);

				switch (line[i + 1]) {
					case "f":
						fg = num;
						break;
					case "F":
						fg = num + 8;
						break;
					case "b":
						bg = num;
						break;
					case "B":
						bg = num + 8;
						break;
				}

				i += 2;

				const desired: string[] = [];

				if (bg !== default_bg) {
					desired.push(`b${bg}`);
				}

				if (fg !== default_fg) {
					desired.push(`f${fg}`);
				}

				const { spans, tags } = reconcileSpans(open_spans, desired);
				open_spans = spans;
				html.push(...tags);

				continue;
			}

			// tab
			if (c === "\t") {
				const tab_chars = TAB_WIDTH - (col % TAB_WIDTH);
				col += tab_chars;
				html.push(" ".repeat(tab_chars));

				continue;
			}

			if (col + 1 > cols) {
				break;
			}

			html.push(escapeHtml(c));
			col++;
		}

		if (row < lines.length - 1) {
			html.push("\n");
		}
	}

	// close any spans still open at the end
	html.push(...reconcileSpans(open_spans, []).tags);

	return html.join("");
}

function colourAsHex(i: number): string {
	const r = PALETTE[i * 3].toString(16).padStart(2, "0");
	const g = PALETTE[i * 3 + 1].toString(16).padStart(2, "0");
	const b = PALETTE[i * 3 + 2].toString(16).padStart(2, "0");
	return `#${r}${g}${b}`;
}

function generateCss(): string {
	const classes: string[] = [];

	for (let i = 0; i < 16; i++) {
		const hex = colourAsHex(i);
		classes.push(`.f${i} {\n\tcolor: ${hex};\n}`);
		classes.push(`.b${i} {\n\tbackground-color: ${hex};\n}`);
	}

	return CSS_HEAD + "\n" + classes.join("\n\n") + "\n";
}

function generate(src_dir: string, out_dir: string) {
	for (const entry of readdirSync(src_dir)) {
		const src_path = join(src_dir, entry);
		const stat = statSync(src_path);

		if (stat.isDirectory()) {
			generate(src_path, join(out_dir, entry.toLowerCase()));
			continue;
		}

		const name = basename(entry);
		const html_name = name.toLowerCase() + ".html";
		const out_path = join(out_dir, html_name);

		const content = readFileSync(src_path, "utf8");
		const body = textToHtml(content, COLS, true);

		const html = `<!doctype HTML>
<html>
<head>
<title>micahdb.com - ${name}</title>
<link rel="stylesheet" href="/raw/index.css" />
</head>
<body>
<pre>
${body}
</pre>
</body>
</html>
`;

		mkdirSync(dirname(out_path), { recursive: true });
		writeFileSync(out_path, html);

		console.log(`generated ${out_path}`);
	}
}

function main() {
	mkdirSync(OUTPUT_DIR, { recursive: true });
	const css_path = join(OUTPUT_DIR, "index.css");
	writeFileSync(css_path, generateCss());
	console.log(`generated ${css_path}`);

	generate(CONTENT_DIR, OUTPUT_DIR);
}

main();
