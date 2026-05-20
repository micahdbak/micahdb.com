import { Terminal } from "./terminal.ts";

// components
import { Divider } from "./components/divider.ts";
import { Link } from "./components/link.ts";
import { Markdown } from "./components/markdown.ts";
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
	0x14, 0x14, 0x15, // 16: bg
	0xcd, 0xcd, 0xcd  // 17: fg
];

const PANE_RATIO = 1.0 - 1.0 / 1.618;

const BIO_ART = `\
 ▄▄ ▐   
 ▌▌▌▐▀▌ 
 ▌▌▌▐▄▌ `;

const BIO = `\
Micah Baker
Software Developer
Vancouver, BC, Canada`;

const BODY = `\
# micahdb.com

Welcome to &11b;&0;my&17;&16b; &15;&9b;website&17;&16b;.

Here is a [link](https://micahdb.com).

## This is a subheading

1. This is a list item
1. This is another
1. This is another, another`;

const EMAIL = "mailto:<micah_baker@sfu.ca>";
const GITHUB = "https://github.com/micahdbak";
const LINKEDIN = "https://linkedin.com/in/micahdbak";
const RESUME = "/resume.pdf";

const BIO_ROWS = 8;
const BIO_COLS = 40;

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

/*
Useful Chars:
┐ ┌ ┘ └ │ ─ ├ ┤ ┴ ┬
▄ ▀ ▐ ▌
█ ▓ ▒ ░
*/

const main = async () => {
	const canvas = document.getElementById("webgl") as HTMLCanvasElement;

	try {
		const terminal = new Terminal(canvas);
		await terminal.init();
		terminal.setPalette(new Float32Array(PALETTE.map((e) => e / 0xff)));

		// components

		const divider = new Divider(terminal, PANE_RATIO);
		const table = new Table(terminal);
		const markdown = new Markdown(terminal, BODY);

		// draw loop

		let wide = false;

		const draw = () => {
			terminal.clear();

			// pane management

			let pane1, pane2;
			const lcols = divider.lcols;

			pane1 = [0, 0, terminal.rows, lcols]; // left
			pane2 = [0, lcols, terminal.rows, terminal.cols - lcols - 1]; // right
			terminal.resize(...pane2);

			divider.draw(
				Divider.VERTICAL,
				0,
				0,
				terminal.rows,
				terminal.cols,
				0,
				BIO_COLS + 4
			);

			// TUI

			// bio

			const bio_row = 2;
			const bio_col = 2;
			const trow = bio_row + 4; // first table *text* row
			const tcol1 = bio_col + 2; // first table column
			const tcol2 = bio_col + 1 + 10 + 2; // second table column

			// bio art / blurb
			terminal.drawText(BIO_ART, bio_row, tcol1, 8, 12);
			terminal.drawText(BIO, bio_row, tcol2, 16, 17);

			table.draw(bio_row + 3, bio_col, 1, 2, [4], [10, 27], 16, 8);

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

			const readme_row = bio_row + trow + 4;
			markdown.draw(readme_row, pane1[1] + 2, pane1[3] - 4);

			terminal.draw();

			requestAnimationFrame(draw);
		};

		requestAnimationFrame(draw);
	} catch (err: Error) {
		console.error(err);
	}
};

await main();
