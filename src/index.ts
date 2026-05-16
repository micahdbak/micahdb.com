import { Terminal } from "./terminal.ts";

// components
import { Divider } from "./components/divider.ts";
import { Link } from "./components/link.ts";
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

const BIO_ART = `\
 ▄▄ ▐   
 ▌▌▌▐▀▌ 
 ▌▌▌▐▄▌ `;

const BIO = `\
Micah Baker
Software Developer
Vancouver, BC, Canada`;

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

		let hsplit, vsplit;

		if (terminal.cols > 2 * terminal.rows) {
			vsplit = new Divider(terminal, 1.0 / 1.618);
			hsplit = new Divider(terminal, 1.0 - 1.0 / 1.618);
		} else {
			vsplit = new Divider(terminal, 1.0 - 1.0 / 1.618);
			hsplit = new Divider(terminal, 1.0 / 1.618);
		}

		const table = new Table(terminal);
		const link = new Link(terminal);

		// draw loop

		let wide = false;

		const draw = () => {
			terminal.clear();
			const _wide = terminal.cols > 2 * terminal.rows;

			// on horiz -> vert (vice-versa) switch, re-set the dividers
			if (wide !== _wide) {
				if (_wide) {
					vsplit.setFrac(1.0 / 1.618);
					hsplit.setFrac(1.0 - 1.0 / 1.618);
				} else {
					vsplit.setFrac(1.0 - 1.0 / 1.618);
					hsplit.setFrac(1.0 / 1.618);
				}

				wide = _wide;
			}

			// pane management

			let pane1, pane2, pane3;
			const trows = vsplit.trows; // rows in the top split
			const lcols = hsplit.lcols; // columns in the left split

			if (wide) {
				pane1 = [0, 0, trows, lcols]; // top-left
				pane2 = [trows + 1, 0, terminal.rows - trows - 1, lcols]; // bottom-left
				pane3 = [0, lcols + 1, terminal.rows, terminal.cols - lcols - 1]; // right (visuals)
				terminal.resize(...pane3);

				vsplit.draw(
					Divider.HORIZONTAL,
					0,
					0,
					terminal.rows,
					lcols,
					BIO_ROWS + 2,
					BIO_COLS + 2,
					trows,
					lcols,
					Divider.INTERSECT_RIGHT
				);

				hsplit.draw(
					Divider.VERTICAL,
					0,
					0,
					terminal.rows,
					terminal.cols,
					BIO_ROWS + 2,
					BIO_COLS + 2,
					trows,
					lcols,
					Divider.INTERSECT_LEFT
				);
			} else {
				pane1 = [0, 0, trows, lcols]; // top-left
				pane2 = [0, lcols + 1, trows, terminal.cols - lcols - 1]; // top-right
				pane3 = [trows + 1, 0, terminal.rows - trows - 1, terminal.cols]; // bottom (visuals)
				terminal.resize(...pane3);

				hsplit.draw(
					Divider.VERTICAL,
					0,
					0,
					trows,
					terminal.cols,
					BIO_ROWS + 2,
					BIO_COLS + 2,
					trows,
					lcols,
					Divider.INTERSECT_BOTTOM
				);

				vsplit.draw(
					Divider.HORIZONTAL,
					0,
					0,
					terminal.rows,
					terminal.cols,
					BIO_ROWS + 2,
					BIO_COLS + 2,
					trows,
					lcols,
					Divider.INTERSECT_TOP
				);
			}

			// TUI

			const bio_row = Math.floor((pane1[2] - BIO_ROWS) / 2);
			const bio_col = Math.floor((pane1[3] - BIO_COLS) / 2);
			const trow = bio_row + 4;
			const tcol1 = bio_col + 2;
			const tcol2 = bio_col + 1 + 10 + 2;

			terminal.drawText(BIO_ART, bio_row, tcol1, 15, 16);

			terminal.drawText(BIO, bio_row, tcol2, 16, 17);
			table.draw(bio_row + 3, bio_col, 1, 2, [4], [10, 27], 16, 8);

			terminal.drawText("E-mail", trow, tcol1, 16, 17);
			terminal.drawText("GitHub", trow + 1, tcol1, 16, 17);
			terminal.drawText("LinkedIn", trow + 2, tcol1, 16, 17);
			terminal.drawText("Resume", trow + 3, tcol1, 16, 17);

			link.draw("<micah_baker@sfu.ca>", EMAIL, trow, tcol2, 16, 12, 15, 16);
			link.draw(
				"github.com/micahdbak",
				GITHUB,
				trow + 1,
				tcol2,
				16,
				12,
				15,
				16
			);
			link.draw(
				"linkedin.com/in/micahdbak",
				LINKEDIN,
				trow + 2,
				tcol2,
				16,
				12,
				15,
				16
			);
			link.draw(RESUME, RESUME, trow + 3, tcol2, 16, 12, 15, 16);

			terminal.draw();

			requestAnimationFrame(draw);
		};

		requestAnimationFrame(draw);
	} catch (err: Error) {
		console.error(err);
	}
};

await main();
