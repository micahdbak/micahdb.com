import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { join, dirname, basename } from "node:path";

import { Colour, PALETTE, textToLines, TAB_WIDTH } from "@creat/tscon";

const CONTENT_DIR = "src/pages/content";
const OUTPUT_DIR = "build";
const COLS = 80;

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

function escapeHtml(s: string): string {
	return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
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

			// anchor escape sequence
			// \a0{Display Text|URL} : link
			// \a9{Display Text|#anchor} : section anchor
			if (escape && i + 2 < line.length && line[i + 1] === "a" && !isNaN(Number(line[i + 2]))) {
				const num = Math.max(Math.min(Number(line[i + 2]), 9), 0);
				let skip_chars = 2;
				let options = null;

				if (i + 3 < line.length && line[i + 3] === "{") {
					const closing_brace = line.indexOf("}", i + 3);

					if (closing_brace > i + 3) {
						options = line.slice(i + 4, closing_brace);
						skip_chars = closing_brace - i;
					}
				}

				if (options !== null && (num === 0 || num === 9)) {
					const split = options.split("|");
					const text = split[0];
					const url = split.length > 1 ? split[1] : split[0];

					if (num === 0) {
						html.push(`<a href="${escapeHtml(url)}" class="f12">${escapeHtml(text)}</a>`);
					} else {
						const anchor_id = url.startsWith("#") ? url.slice(1) : url;
						html.push(`<span id="${escapeHtml(anchor_id)}" class="f15">${escapeHtml(text)}</span>`);
					}

					i += text.length;
					col += text.length;
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
		classes.push(`.f${i} { color: ${hex}; }`);
		classes.push(`.b${i} { background-color: ${hex}; }`);
	}

	return classes.join("\n") + "\n";
}

function generate(src_dir: string, out_dir: string) {
	for (const entry of readdirSync(src_dir)) {
		const src_path = join(src_dir, entry);
		const stat = statSync(src_path);

		if (stat.isDirectory()) {
			// recursively call generate on directory
			generate(src_path, join(out_dir, entry.toLowerCase()));
			continue;
		}

		const name = basename(entry);

		const html_name = name.toLowerCase() + ".html";
		const html_path = join(out_dir, html_name);

		// content is of the form:
		// title
		// ---- <- arbitrary separator line
		// content
		let content = readFileSync(src_path, "utf8");
		const first_nl = content.indexOf("\n");
		const second_nl = first_nl + 1 + content.slice(first_nl + 1, -1).indexOf("\n");
		const title = content.slice(0, first_nl);
		content = content.slice(second_nl + 1, -1);

		const body = textToHtml(content, COLS, true);

		const html = `\
<!doctype HTML>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<meta name="description" content="Micah Baker's software development portfolio." />
<meta name="author" content="Micah Baker" />
<meta property="og:title" content="micahdb.com - ${name}" />
<meta property="og:description" content="Micah Baker's software development portfolio." />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://micahdb.com/" />
<meta property="og:image" content="https://micahdb.com/images/og.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/png" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="stylesheet" href="/index.css" />
<link rel="stylesheet" href="/palette.css" />
<script type="module" src="/index.js"></script>
</head>
<body>
<div id="raw">
<pre>
${body}
</pre>
</div>
<canvas id="webgl" class="hidden"></canvas>
</body>
</html>
`;

		mkdirSync(dirname(html_path), { recursive: true });
		writeFileSync(html_path, html);

		console.log(`generated ${html_path}`);
	}
}

function main() {
	mkdirSync(OUTPUT_DIR, { recursive: true });
	const css_path = join(OUTPUT_DIR, "palette.css");

	writeFileSync(css_path, generateCss());
	console.log(`generated ${css_path}`);

	generate(CONTENT_DIR, OUTPUT_DIR);
}

main();
