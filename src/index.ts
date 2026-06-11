import { Terminal } from "./terminal.ts";

// components
import { Divider } from "./components/divider.ts";
import { Scrollable } from "./components/scrollable.ts";
import { Markdown } from "./components/markdown.ts";

// prettier-ignore
const PALETTE = [
	// dark colours
	0x28, 0x2a, 0x2e, // 0: black
	0xa5, 0x42, 0x42, // 1: red
	0xde, 0x93, 0x5f, // 2: orange
	0x8c, 0x94, 0x40, // 3: green
	0x5e, 0x8d, 0x87, // 4: cyan
	0x5f, 0x81, 0x9d, // 5: blue
	0x85, 0x67, 0x8f, // 6: purple
	0x86, 0x88, 0x86, // 7: white

	// bright colours
	0x37, 0x3b, 0x41, // 8: gray
	0xcc, 0x66, 0x66, // 9: red
	0xf0, 0xc6, 0x74, // 10: yellow
	0xb5, 0xbd, 0x68, // 11: green
	0x8a, 0xbe, 0xb7, // 12: cyan
	0x81, 0xa2, 0xbe, // 13: blue
	0xb2, 0x94, 0xbb, // 14: purple
	0xd5, 0xd8, 0xd6, // 15: white

	// extra colours
	0x11, 0x11, 0x12, // 16: bg
	0xcd, 0xcd, 0xcd  // 17: fg
];

const PANE_RATIO = 1.0 - 1.0 / 1.618;
const PANE_COLS = 48;
const PANE_ROW_PADDING = 1;
const PANE_COL_PADDING = 2;

/*
Useful Chars:
█ ▓ ▒ ░

▄ ▀ ▐ ▌

▝ ▗ ▖ ▘

▙ ▛ ▜ ▟

▞ ▚

┐ ┌ ┘ └

├ ┤ ┴ ┬

│ ─
*/

/*
const EMAIL = "mailto:<micah_baker@sfu.ca>";
const GITHUB = "https://github.com/micahdbak";
const LINKEDIN = "https://linkedin.com/in/micahdbak";
const RESUME = "/resume.pdf";
*/

const NAME = `&15;\
█▐▌▀ @ ▄▖▐@ ▐▀▄ ▄ ▌▄ ▄ ▄ &n;
▌▌▌█▐▀▘▗▟▐▜ ▐▀▄ ▄▌▙▘▐▄▌▌▀&n;
▌ ▌█▐▄▞▚▟▐▐ ▐▄▀▝▄▌▌▙▝▄ ▌&17;`.replaceAll("@", "&17; &15;");

const CARD = `\
${NAME}&n;
&7;-------------------------&17;&n;
&11;**I am a**&17;: Software Engineer&n;
&11;**Based in**&17;: Vancouver, BC, Canada&n;
&11;**Currently**&17;: Studying&n;
&11;**Previously**&17;: Open WebUI, Improving, Brave&n;
&11;**Education**&17;: BSc Computing Science at [SFU](https://sfu.ca)&n;
&11;**E-mail**&17;: [\\<micah_baker@sfu.ca\\>](mailto:<micah_baker@sfu.ca>)&n;
&11;**GitHub**&17;: [@micahdbak](https://github.com/micahdbak)&n;
&11;**LinkedIn**&17;: [/in/micahdbak](https://linkedin.com/in/micahdbak)&n;
&11;**Resume/CV**&17;: [/resume.pdf](https://micahdb.com/resume.pdf)

&0;███&1;███&3;███&2;███&5;███&6;███&4;███&7;███&n;
&8;███&9;███&11;███&10;███&13;███&14;███&12;███&15;███&n;`;

const BODY = `\
&7;\\*&17; &7;*About*&17;&n;
&7;\\*&17; [Education](#)&n;
&7;\\*&17; [Experience](#)&n;
&7;\\*&17; [Research](#)&n;
&7;\\*&17; [Projects](#)&n;
&7;\\*&17; [Blog](#) &7;- Updated *2026, June 9th*&17;

\\&7;----&17;

# About

Welcome to my website.`;

const main = async () => {
	const log = document.getElementById("log");
	const canvas = document.getElementById("webgl") as HTMLCanvasElement;

	try {
		const startTime = Date.now();

		const logMessage = (source: string, message: string) => {
			let timestamp = ((Date.now() - startTime) / 1000).toFixed(6);
			const leadingSpaces = " ".repeat(12 - timestamp.length);
			timestamp = `[${leadingSpaces}${timestamp}]`;

			const pre = document.createElement("pre");
			pre.textContent = `${timestamp} ${source}: ${message}`;
			log.appendChild(pre);
		};

		logMessage("micahdb.com", "init");

		const terminal = new Terminal(canvas, logMessage);
		await terminal.init();

		logMessage("micahdb.com", "done loading");

		// spare a moment before displaying the canvas
		await new Promise((resolve) => {
			setTimeout(resolve, 250);
		});

		log.className = "hidden";
		canvas.className = "";

		terminal.setPalette(new Float32Array(PALETTE.map((e) => e / 0xff)));

		// components

		const divider = new Divider(terminal, PANE_RATIO, false);
		const scrollable = new Scrollable(terminal);
		const mdcard = new Markdown(terminal, CARD);
		const mdbody = new Markdown(terminal, BODY);

		// draw loop

		let row_offset = 0;

		const draw = () => {
			terminal.clear();

			// pane management

			let pane1, pane2;

			if (terminal.cols > 2 * terminal.rows) {
				divider.setFrac(PANE_RATIO);
				divider.draw(
					Divider.VERTICAL,
					0,
					0,
					terminal.rows,
					terminal.cols,
					0,
					PANE_COLS
				);

				const lcols = divider.lcols;
				pane1 = [0, 0, terminal.rows, lcols]; // left
				pane2 = [0, lcols + 1, terminal.rows, terminal.cols - lcols - 1]; // right

				terminal.resize(...pane2);
			} else {
				divider.setFrac(0.5);
				divider.draw(
					Divider.HORIZONTAL,
					0,
					0,
					terminal.rows,
					terminal.cols,
					0,
					0
				);

				const trows = divider.trows;
				pane1 = [0, 0, trows, terminal.cols]; // top
				pane2 = [trows + 1, 0, terminal.rows - trows - 1, terminal.cols]; // bottom

				terminal.resize(...pane2);
			}

			// TUI

			const card_row = PANE_ROW_PADDING - row_offset;
			mdcard.draw(
				card_row,
				pane1[1] + PANE_COL_PADDING,
				pane1[2] - card_row,
				pane1[3] - 2 * PANE_COL_PADDING
			);

			const body_row = card_row + mdcard.rows;
			mdbody.draw(
				body_row,
				pane1[1] + PANE_COL_PADDING,
				pane1[2] - body_row,
				pane1[3] - 2 * PANE_COL_PADDING
			);

			const inner_rows = mdcard.rows + mdbody.rows + 2 * PANE_ROW_PADDING;
			scrollable.draw(pane1[0], pane1[1], pane1[2], pane1[3], inner_rows);
			row_offset = scrollable.row_offset;
			terminal.draw();

			requestAnimationFrame(draw);
		};

		requestAnimationFrame(draw);
	} catch (err: Error) {
		console.error(err);
	}
};

await main();
