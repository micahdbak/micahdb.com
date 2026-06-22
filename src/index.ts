import { Canvas } from "./canvas.ts";
import { Terminal } from "./terminal.ts";

// components
import { Divider } from "./components/divider.ts";
import { Scrollable } from "./components/scrollable.ts";
import { Markdown } from "./components/markdown.ts";

// content
import { loadContent } from "./content.macro.ts" with { type: "macro" };
const INDEX_URL = "#";

//
//  █ ▓ ▒ ░
//
//  ▄ ▀ ▐ ▌ ▝ ▗ ▖ ▘ ▙ ▛ ▜ ▟ ▞ ▚
//
//  ┐ ┌ ┘ └ ├ ┤ ┴ ┬ │ ─

const PANE_RATIO = 1.0 - 1.0 / 1.618;
const PANE_COLS = 50;
const PANE_ROW_PADDING = 1;
const PANE_COL_PADDING = 2;

const CARD = `\
█▐▌▀ ▄ ▄ ▐ % ▐▀▄ ▄ ▌▄ ▄% ▄&n;
▌▌▌▌█% ▄█▐▀▄ ▐▀▄ ▄▌█ ▐▄▀▐ ▀&n;
▌ ▌▌▀▄▐▄█▐ █ ▐▄▀▐▄▌▌█▐▄▄▐&n;
&n;
&12;**I am a**&17;: % % Software Developer&n;
&12;**Based in**&17;: % Vancouver, BC, Canada&n;
&12;**Currently**&17;: %Studying&n;
&12;**Previously**&17;: Open WebUI, Improving, Brave&n;
&12;**Education**&17;: %BSc Computing Science at SFU&n;
&n;
&12;**E-mail**&17;: % % [mailto:\\<micah_baker@sfu.ca\\>](mailto:<micah_baker@sfu.ca>)&n;
&12;**GitHub**&17;: % % [](https://github.com/micahdbak)&n;
&12;**LinkedIn**&17;: % [](https://linkedin.com/in/micahdbak)&n;
&12;**Resume/CV**&17;: %[/resume.pdf](https://micahdb.com/resume.pdf)

&0;███&1;███&3;███&2;███&5;███&6;███&4;███&7;███&n;
&8;███&9;███&11;███&10;███&13;███&14;███&12;███&15;███

----`.replaceAll("%", "&17; &17;");

const main = async () => {
	const canvas_el = document.getElementById("webgl") as HTMLCanvasElement;

	try {
		const content = await loadContent();
		const canvas = new Canvas(canvas_el);
		const terminal = new Terminal(canvas);
		await terminal.init();

		// components

		const divider = new Divider(terminal, PANE_RATIO, false);
		const scrollable = new Scrollable(terminal);
		const mdcard = new Markdown(terminal, CARD);

		const mdcache: Record<string, Markdown> = {};

		// anchor change -> content change

		let url = window.location.hash;
		if (!content[url]) {
			url = INDEX_URL;
		}

		let mdbody = new Markdown(terminal, content[url]);
		mdcache[url] = mdbody;

		window.addEventListener("hashchange", () => {
			let new_url = window.location.hash;

			if (new_url.length === 0) {
				new_url = INDEX_URL;
			}

			if (!content[new_url]) {
				window.location.hash = INDEX_URL;
				return;
			}

			url = new_url;

			if (!mdcache[url]) {
				mdbody = new Markdown(terminal, content[url]);
				mdcache[url] = mdbody;
			} else {
				mdbody = mdcache[url];
			}
		});

		// draw loop

		let row_offset = 0;

		const draw = () => {
			terminal.clear();

			// pane management

			let pane1, pane2;

			if (canvas.cols > 2 * canvas.rows) {
				divider.setFrac(PANE_RATIO);
				divider.draw(
					Divider.VERTICAL,
					0,
					0,
					canvas.rows,
					canvas.cols,
					0,
					PANE_COLS
				);

				const lcols = divider.lcols;
				pane1 = [0, 0, canvas.rows, lcols]; // left
				pane2 = [0, lcols + 1, canvas.rows, canvas.cols - lcols - 1]; // right

				terminal.resizeProgram(...pane2);
			} else {
				divider.setFrac(0.5);
				divider.draw(Divider.HORIZONTAL, 0, 0, canvas.rows, canvas.cols, 0, 0);

				const trows = divider.trows;
				pane1 = [0, 0, trows, canvas.cols]; // top
				pane2 = [trows + 1, 0, canvas.rows - trows - 1, canvas.cols]; // bottom

				terminal.resizeProgram(...pane2);
			}

			// TUI

			const card_row = PANE_ROW_PADDING - row_offset;
			mdcard.draw(
				card_row,
				pane1[1] + PANE_COL_PADDING,
				pane1[2] - card_row,
				pane1[3] - 2 * PANE_COL_PADDING
			);

			const body_row = card_row + mdcard.rows + 1;
			mdbody.draw(
				body_row,
				pane1[1] + PANE_COL_PADDING,
				pane1[2] - body_row,
				pane1[3] - 2 * PANE_COL_PADDING
			);

			const inner_rows = mdcard.rows + 1 + mdbody.rows + 2 * PANE_ROW_PADDING;
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
