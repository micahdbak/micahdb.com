import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import * as tscon from "@micahdb/tscon";
import { Link } from "@/link.ts";
import { PALETTE } from "./palette.ts";

const CONTENT_DIR = "src/pages/content";
const OUTPUT_DIR = "build";
const COLS = 80;

/** The colour state one source line carries across its wrapped display rows. */
interface Colours {
	fg: number;
	bg: number;
	spans: string[];
}

type HtmlLink = {
	url: string;
	spans: tscon.Spans;
};

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

	for (const cls of desired.slice(i)) {
		spans.push(cls);
		tags.push(`<span class="${cls}">`);
	}

	return { spans, tags };
}

// moves the open spans to `desired`, returning the tags that get them there
function recolour(colours: Colours, desired: string[]): string {
	const { spans, tags } = reconcileSpans(colours.spans, desired);

	colours.spans = spans;

	return tags.join("");
}

// the classes that paint the current colours; the defaults need none
function spanClasses({ fg, bg }: Colours): string[] {
	const classes: string[] = [];

	if (bg !== tscon.Colour.BG) {
		classes.push(`b${bg}`);
	}

	if (fg !== tscon.Colour.FG) {
		classes.push(`f${fg}`);
	}

	return classes;
}

function escapeHtml(s: string): string {
	return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

// converts formatted glyph text into HTML with minimal <span> usage
export function textToHtml(text: string, cols: number, wrap: tscon.Wrap): string {
	if (cols <= 0) {
		return "";
	}

	return text
		.split("\n")
		.map((source) => sourceToHtml(source, cols, wrap))
		.join("\n");
}

// one buffer line as HTML rows. The emulator compiles a line at a time, so a
// line starts at the default colours whatever the line above left set
function sourceToHtml(source: string, cols: number, wrap: tscon.Wrap): string {
	const colours: Colours = {
		fg: tscon.Colour.FG,
		bg: tscon.Colour.BG,
		spans: [],
	};
	const glyphs = new tscon.Glyphs(source, cols, { wrap });
	const links = Link.parse(glyphs).map((link) => ({
		url: link.url,
		spans: glyphs.spansFor(link.start, link.end),
	}));

	// a blank line is still a row, even though it wraps to nothing
	const display = glyphs.wrappedText.length === 0 ? [""] : glyphs.wrappedText;

	return display
		.map((line, at) => {
			const html = rowToHtml(line, at, cols, colours, links);

			// the colours a line leaves set close with it
			return at === display.length - 1 ? html + recolour(colours, []) : html;
		})
		.join("\n");
}

function linkAt(links: HtmlLink[], row: number, col: number): string | null {
	for (const link of links) {
		if (link.spans.contains(row, col)) {
			return link.url;
		}
	}

	return null;
}

// one display row of source text, with its colours left open for the next row
function rowToHtml(
	line: string,
	row: number,
	cols: number,
	colours: Colours,
	links: HtmlLink[]
): string {
	const html: string[] = [];
	const link_colour = `f${tscon.Colour.BRIGHT_CYAN} b${tscon.Colour.BG}`;

	let col = 0;
	let open_url: string | null = null;

	const setLink = (url: string | null): void => {
		if (url === open_url) {
			return;
		}

		if (open_url !== null) {
			html.push("</a>");
		}

		if (url !== null) {
			html.push(`<a href="${escapeHtml(url)}" class="${link_colour}">`);
		}

		open_url = url;
	};

	for (let i = 0; i < line.length; ) {
		const scan = tscon.scanEscapeAt(line, i);

		// anchor escape sequence
		// \a0{href} display \a1 : link
		// \a0href\a1 : link whose href is its display text
		// \a9{Display Text|#anchor} : section anchor
		if (scan.kind === "anchor") {
			if (scan.options !== null && scan.group === 9) {
				const [text = "", url = text] = scan.options.split("|");
				const anchor_id = url.startsWith("#") ? url.slice(1) : url;

				setLink(linkAt(links, row, col));
				html.push(`<span id="${escapeHtml(anchor_id)}">${escapeHtml(text)}</span>`);
				i += text.length;
				col += text.length;
			}

			i += scan.chars;
			continue;
		}

		if (scan.kind === "clear") {
			const active = open_url;

			setLink(null);
			colours.fg = tscon.Colour.FG;
			colours.bg = tscon.Colour.BG;
			i += scan.chars;
			html.push(recolour(colours, []));
			setLink(active);

			continue;
		}

		if (scan.kind === "colour") {
			const value = Math.min(scan.num, 7) + (scan.bright ? 8 : 0);
			const active = open_url;

			setLink(null);

			if (scan.attribute === "fg") {
				colours.fg = value;
			} else {
				colours.bg = value;
			}

			i += scan.chars;
			html.push(recolour(colours, spanClasses(colours)));
			setLink(active);

			continue;
		}

		// an escaped backslash displays one backslash
		const visible = scan.chars === 2 ? "\\" : line.charAt(i);

		// tab
		if (visible === "\t") {
			const tab_chars = Math.min(tscon.TAB_WIDTH - (col % tscon.TAB_WIDTH), cols - col);

			setLink(linkAt(links, row, col));
			col += tab_chars;
			html.push(" ".repeat(Math.max(tab_chars, 0)));

			i += scan.chars;
			continue;
		}

		if (col + 1 > cols) {
			break;
		}

		setLink(linkAt(links, row, col));
		html.push(escapeHtml(visible));
		col++;
		i += scan.chars;
	}

	setLink(null);

	return html.join("");
}

function generateCss(): string {
	const rules: string[] = [];
	const hex = (colour: readonly [number, number, number]) =>
		"#" + colour.map((c) => c.toString(16).padStart(2, "0")).join("");

	for (const [i, [r, g, b]] of PALETTE.colours.entries()) {
		const value = hex([r, g, b]);

		rules.push(`.f${i} { color: ${value}; }`);
		rules.push(`.b${i} { background-color: ${value}; }`);
	}

	// text with no escapes draws in the cell grid's default colours, so the
	// fallback states them rather than inheriting the page's
	const foreground = hex(PALETTE.colours[tscon.Colour.FG]!);
	const background = hex(PALETTE.colours[tscon.Colour.BG]!);

	rules.push(`#raw pre { color: ${foreground}; background-color: ${background}; }`);

	return rules.join("\n") + "\n";
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

		const body = textToHtml(content, COLS, tscon.Wrap.WORD);

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
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="icon" href="/favicon-16.png" type="image/png" sizes="16x16" />
<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32" />
<link rel="icon" href="/favicon.ico" sizes="48x48" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
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

if (import.meta.main) {
	main();
}
