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
	0x25, 0x25, 0x30, // 0: black
	0xd8, 0x64, 0x7e, // 1: red
	0x7f, 0xa5, 0x63, // 2: green
	0xf3, 0xbe, 0x7c, // 3: yellow
	0x6e, 0x94, 0xb2, // 4: blue
	0xbb, 0x9d, 0xbd, // 5: purple
	0xae, 0xae, 0xd1, // 6: cyan
	0xcd, 0xcd, 0xcd, // 7: white

	// bright colours
	0x60, 0x60, 0x79, // 8: gray
	0xe0, 0x83, 0x98, // 9: red
	0x99, 0xb7, 0x82, // 10: green
	0xf5, 0xcb, 0x96, // 11: yellow
	0x8b, 0xa9, 0xc1, // 12: blue
	0xc9, 0xb1, 0xca, // 13: purple
	0xbe, 0xbe, 0xda, // 14: cyan
	0xd7, 0xd7, 0xd7, // 15: white

	// extra colours
	0, 0, 0, //0x14, 0x14, 0x15, // 16: bg
	0xcd, 0xcd, 0xcd  // 17: fg
];

const PANE_RATIO = 1.0 - 1.0 / 1.618;

/*
Useful Chars:
┐ ┌ ┘ └ │ ─ ├ ┤ ┴ ┬
▄ ▀ ▐ ▌
█ ▓ ▒ ░
*/

/*
const CARD_ART = `\
 ▄▄ ▐   
 ▌▌▌▐▀▌ 
 ▌▌▌▐▄▌ `;
*/

/*
▄▄ ▀   ▄ ▌   ▐▀▄ ▄ ▌▌ ▄ ▄ 
▌▌▌█▐▀ ▄▌█▀▌ ▐▀▄ ▄▌█ █▄▌▌▀
▌▌▌█▐▄▐▄▌▌ ▌ ▐▄▀▐▄▌▌▌▀▄ ▌ 
*/

const NAME_ART = `\

█▄ ▄█ ▀  ▄▄  ▄▄ █     █▀▄  ▄▄ █ ▄ ▄▄  ▄▄
█ ▀ █ █ █   █ █ █▀▄   █▀▄ █ █ █▄▀ █▄█ █ ▀
█   █ █ ▀▄▄ ▀▄█ █ █   █▄▀ ▀▄█ █ █ ▀▄▄ █ 

Software Developer
Vancouver, BC, Canada
`;

/*
const CARD_TEXT = `\
Software Developer
Vancouver, BC, Canada`;
*/

const CARD_ROWS = 9;
const CARD_COLS = 44;
const CARD_PADDING = 1;

const BODY = `\
# micahdb.com

Welcome to &11b;&0;my&17;&16b; &15;&9b;website&17;&16b;.

Here is a [link](https://micahdb.com).

## &12;This is a _subheading_&17;

1. This is a list item
1. This is another
1. This is another, another

### This is a sub-sub-heading

This is a paragraph

### This is a sub-sub-heading

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec eu efficitur dolor, non vestibulum tellus. Morbi vel porttitor lacus. Mauris maximus, ante vitae sollicitudin porttitor, nibh mi eleifend urna, vitae blandit augue mauris sit amet metus. Aenean posuere vitae sem aliquam efficitur. Proin sem sapien, iaculis vitae lacinia vitae, efficitur ac tortor. Nam eget lectus sollicitudin, gravida risus nec, dapibus diam. Quisque quis pretium nunc. Fusce ultricies, nunc id tempor porta, lectus nibh consectetur ante, eu tristique dui neque id sapien. Mauris sollicitudin libero a massa egestas suscipit. Sed tempus rutrum neque, eget volutpat nisi venenatis vitae. In eu iaculis.

### This is a sub-sub-heading

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec eu efficitur dolor, non vestibulum tellus. Morbi vel porttitor lacus. Mauris maximus, ante vitae sollicitudin porttitor, nibh mi eleifend urna, vitae blandit augue mauris sit amet metus. Aenean posuere vitae sem aliquam efficitur. Proin sem sapien, iaculis vitae lacinia vitae, efficitur ac tortor. Nam eget lectus sollicitudin, gravida risus nec, dapibus diam. Quisque quis pretium nunc. Fusce ultricies, nunc id tempor porta, lectus nibh consectetur ante, eu tristique dui neque id sapien. Mauris sollicitudin libero a massa egestas suscipit. Sed tempus rutrum neque, eget volutpat nisi venenatis vitae. In eu iaculis.

### This is a sub-sub-heading

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec eu efficitur dolor, non vestibulum tellus. Morbi vel porttitor lacus. Mauris maximus, ante vitae sollicitudin porttitor, nibh mi eleifend urna, vitae blandit augue mauris sit amet metus. Aenean posuere vitae sem aliquam efficitur. Proin sem sapien, iaculis vitae lacinia vitae, efficitur ac tortor. Nam eget lectus sollicitudin, gravida risus nec, dapibus diam. Quisque quis pretium nunc. Fusce ultricies, nunc id tempor porta, lectus nibh consectetur ante, eu tristique dui neque id sapien. Mauris sollicitudin libero a massa egestas suscipit. Sed tempus rutrum neque, eget volutpat nisi venenatis vitae. In eu iaculis.

### This is a sub-sub-heading

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec eu efficitur dolor, non vestibulum tellus. Morbi vel porttitor lacus. Mauris maximus, ante vitae sollicitudin porttitor, nibh mi eleifend urna, vitae blandit augue mauris sit amet metus. Aenean posuere vitae sem aliquam efficitur. Proin sem sapien, iaculis vitae lacinia vitae, efficitur ac tortor. Nam eget lectus sollicitudin, gravida risus nec, dapibus diam. Quisque quis pretium nunc. Fusce ultricies, nunc id tempor porta, lectus nibh consectetur ante, eu tristique dui neque id sapien. Mauris sollicitudin libero a massa egestas suscipit. Sed tempus rutrum neque, eget volutpat nisi venenatis vitae. In eu iaculis.

### This is a sub-sub-heading

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec eu efficitur dolor, non vestibulum tellus. Morbi vel porttitor lacus. Mauris maximus, ante vitae sollicitudin porttitor, nibh mi eleifend urna, vitae blandit augue mauris sit amet metus. Aenean posuere vitae sem aliquam efficitur. Proin sem sapien, iaculis vitae lacinia vitae, efficitur ac tortor. Nam eget lectus sollicitudin, gravida risus nec, dapibus diam. Quisque quis pretium nunc. Fusce ultricies, nunc id tempor porta, lectus nibh consectetur ante, eu tristique dui neque id sapien. Mauris sollicitudin libero a massa egestas suscipit. Sed tempus rutrum neque, eget volutpat nisi venenatis vitae. In eu iaculis.`;

const EMAIL = "mailto:<micah_baker@sfu.ca>";
const GITHUB = "https://github.com/micahdbak";
const LINKEDIN = "https://linkedin.com/in/micahdbak";
const RESUME = "/resume.pdf";

/*
const ASCII_ART =
	"░░░░░░░█▐▓▓░████▄▄▄█▀▄▓▓▓▌█\n" +
	"░░░░░▄█▌▀▄▓▓▄▄▄▄▀▀▀▄▓▓▓▓▓▌█\n" +
	"░░░▄█▀▀▄▓█▓▓▓▓▓▓▓▓▓▓▓▓▀░▓▌█\n" +
	"░░█▀▄▓▓▓███▓▓▓███▓▓▓▄░░▄▓▐█▌\n" +
	"░█▌▓▓▓▀▀▓▓▓▓███▓▓▓▓▓▓▓▄▀▓▓▐█\n" +
	"▐█▐██▐░▄▓▓▓▓▓▀▄░▀▓▓▓▓▓▓▓▓▓▌█▌\n" +
	"█▌███▓▓▓▓▓▓▓▓▐░░▄▓▓███▓▓▓▄▀▐█\n" +
	"█▐█▓▀░░▀▓▓▓▓▓▓▓▓▓██████▓▓▓▓▐█\n" +
	"▌▓▄▌▀░▀░▐▀█▄▓▓██████████▓▓▓▌█▌\n" +
	"▌▓▓▓▄▄▀▀▓▓▓▀▓▓▓▓▓▓▓▓█▓█▓█▓▓▌█▌\n" +
	"█▐▓▓▓▓▓▓▄▄▄▓▓▓▓▓▓█▓█▓█▓█▓█▓▐█▌";
*/

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
					CARD_COLS + 4
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

			const card_row = CARD_PADDING - row_offset;
			const card_col = 4;
			const trow = card_row + 9; // first table *text* row
			const tcol1 = card_col + 2; // first table column
			const tcol2 = card_col + 1 + 10 + 2; // second table column

			// card art / text
			terminal.drawText(NAME_ART, card_row, card_col, 16, 15);

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

			const readme_row = trow + 5 + CARD_PADDING;
			markdown.draw(
				readme_row,
				pane1[1] + 2,
				pane1[2] - readme_row - 1,
				pane1[3] - 4
			);

			const inner_rows = 2 * CARD_PADDING + CARD_ROWS + markdown.rows + 1;

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
