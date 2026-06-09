import { Terminal } from "./terminal.ts";

// components
import { Divider } from "./components/divider.ts";
import { Link } from "./components/link.ts";
import { Markdown } from "./components/markdown.ts";
import { Scrollable } from "./components/scrollable.ts";
import { Table } from "./components/table.ts";

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
	0x96, 0x98, 0x96, // 7: white

	// bright colours
	0x37, 0x3b, 0x41, // 8: gray
	0xcc, 0x66, 0x66, // 9: red
	0xf0, 0xc6, 0x74, // 10: yellow
	0xb5, 0xbd, 0x68, // 11: green
	0x8a, 0xbe, 0xb7, // 12: cyan
	0x81, 0xa2, 0xbe, // 13: blue
	0xb2, 0x94, 0xbb, // 14: purple
	0xc5, 0xc8, 0xc6, // 15: white

	// extra colours
	0, 0, 0, //0x14, 0x14, 0x15, // 16: bg
	0xcd, 0xcd, 0xcd  // 17: fg
];

const PANE_RATIO = 1.0 - 1.0 / 1.618;

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

const PANE_COLS = 48;
const PANE_ROW_PADDING = 2;
const PANE_COL_PADDING = 2;

const NAME_ART = `\
█▐▌▀   ▄▖▐  ▐▀▄ ▄ ▌▄ ▄ ▄ 
▌▌▌█▐▀▘▗▟▐▜ ▐▀▄ ▄▌▙▘█▄▌▌▀
▌ ▌█▐▄▞▚▟▐▐ ▐▄▀▝▄▌▌▙▀▄ ▌ 

Software Developer
Vancouver, BC, Canada
`;

const BODY = `\
&16;&17b;██&16b;&0;███&1;███&3;███&2;███&5;███&6;███&4;███&7;███&n;
&16;&17b;██&16b;&8;███&9;███&11;███&10;███&13;███&14;███&12;███&15;███
&17;

# micahdb.com

Welcome to &11b;&0;my&17;&16b; &15;&9b;website&17;&16b;.

Here is a [link](https://micahdb.com).

## &12;This is a _subheading_&17;

1. This is a list item
1. This is another
1. This is another, another

### This is a sub-sub-heading

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec eu efficitur dolor, non vestibulum tellus. Morbi vel porttitor lacus. Mauris maximus, ante vitae sollicitudin porttitor, nibh mi eleifend urna, vitae blandit augue mauris sit amet metus. Aenean posuere vitae sem aliquam efficitur. Proin sem sapien, iaculis vitae lacinia vitae, efficitur ac tortor. Nam eget lectus sollicitudin, gravida risus nec, dapibus diam. Quisque quis pretium nunc. Fusce ultricies, nunc id tempor porta, lectus nibh consectetur ante, eu tristique dui neque id sapien. Mauris sollicitudin libero a massa egestas suscipit. Sed tempus rutrum neque, eget volutpat nisi venenatis vitae. In eu iaculis.`;

const EMAIL = "mailto:<micah_baker@sfu.ca>";
const GITHUB = "https://github.com/micahdbak";
const LINKEDIN = "https://linkedin.com/in/micahdbak";
const RESUME = "/resume.pdf";

const main = async () => {
	const canvas = document.getElementById("webgl") as HTMLCanvasElement;

	try {
		const terminal = new Terminal(canvas);
		await terminal.init();
		terminal.setPalette(new Float32Array(PALETTE.map((e) => e / 0xff)));

		// components

		const divider = new Divider(terminal, PANE_RATIO, false);
		const table = new Table(terminal);
		const markdown = new Markdown(terminal, BODY);
		const scrollable = new Scrollable(terminal);

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

			// card

			const card_rows = 14;
			const card_row = PANE_ROW_PADDING - row_offset;
			const card_col = PANE_COL_PADDING;
			const trow = card_row + 8; // first table *text* row
			const tcol1 = card_col + 2; // first table column
			const tcol2 = card_col + 1 + 10 + 2; // second table column

			// card art / text
			terminal.drawText(NAME_ART, card_row, tcol1, 16, 15);
			table.draw(trow - 1, card_col, 1, 2, [4], [10, 27], 16, 8);

			// column 1
			terminal.drawText("E-mail", trow, tcol1, 16, 17);
			terminal.drawText("GitHub", trow + 1, tcol1, 16, 17);
			terminal.drawText("LinkedIn", trow + 2, tcol1, 16, 17);
			terminal.drawText("Resume", trow + 3, tcol1, 16, 17);

			// column 2
			Link.draw(terminal, "<micah_baker@sfu.ca>", EMAIL, trow, tcol2);
			Link.draw(terminal, "@micahdbak", GITHUB, trow + 1, tcol2);
			Link.draw(terminal, "/in/micahdbak", LINKEDIN, trow + 2, tcol2);
			Link.draw(terminal, "/resume.pdf", RESUME, trow + 3, tcol2);

			// README.md

			const md_row = card_row + card_rows;
			markdown.draw(
				md_row,
				pane1[1] + PANE_COL_PADDING,
				pane1[2] - md_row,
				pane1[3] - 2 * PANE_COL_PADDING
			);

			const inner_rows = card_rows + markdown.rows + 2 * PANE_ROW_PADDING;

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
