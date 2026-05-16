import { Terminal } from "./terminal.ts";
import { FileTree, File, Folder } from "./components/file_tree.ts";
import { Divider } from "./components/divider.ts";

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

const ROOT = new Folder("micahdb.com/", [
	new File("README.md", "# TODO"),
	new Folder("Experience/", [
		new Folder("Open WebUI/", [
			new File("company.txt", "Open WebUI, Austin, TX, USA"),
			new File("role.txt", "Software Developer (Co-op)"),
			new File("tasks.txt", "I did things")
		]),
		new Folder("Improving/", [
			new File("company.txt", "Improving, Vancouver, BC, Canada"),
			new File("role.txt", "Software Developer 1 (Co-op)"),
			new File("tasks.txt", "I did things")
		]),
		new Folder("Brave Technology Coop/", [
			new File("company.txt", "Brave Technology Coop, Vancouver, BC, Canada"),
			new File("role.txt", "Firmware and Software Developer (Co-op)"),
			new File("tasks.txt", "I did things")
		])
	]),
	new Folder("Education/", [
		new Folder("Simon Fraser University/", [
			new File("location.txt", "Burnaby, BC, Canada"),
			new Folder("Research/", [new File("TODO.txt", "")])
		])
	])
]);

const main = async () => {
	const canvas = document.getElementById("webgl") as HTMLCanvasElement;

	try {
		const terminal = new Terminal(canvas);
		await terminal.init();

		let hsplit, vsplit;

		if (terminal.cols > 2 * terminal.rows) {
			vsplit = new Divider(terminal, 1.0 / 1.618);
			hsplit = new Divider(terminal, 1.0 - 1.0 / 1.618);
		} else {
			vsplit = new Divider(terminal, 1.0 - 1.0 / 1.618);
			hsplit = new Divider(terminal, 1.0 / 1.618);
		}

		const file_tree = new FileTree(terminal, ROOT);

		let wide = false;

		terminal.setPalette(new Float32Array(PALETTE.map((e) => e / 0xff)));

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

			let pane1, pane2, pane3;
			const lcols = Math.floor((terminal.cols - 1) * hsplit.frac); // columns in the left split
			const trows = Math.floor((terminal.rows - 1) * vsplit.frac); // rows in the top split

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
					trows,
					lcols,
					Divider.INTERSECT_TOP
				);
			}

			file_tree.draw(
				15,
				12,
				16,
				pane1[0] + 1,
				pane1[1] + 2,
				pane1[2] - 2,
				pane1[3] - 4
			);

			terminal.drawText("2", pane2[0], pane2[1], 11, 8);
			terminal.drawText("3", pane3[0], pane3[1], 11, 8);

			terminal.drawText(
				"2",
				pane2[0] + pane2[2] - 1,
				pane2[1] + pane2[3] - 1,
				12,
				8
			);
			terminal.drawText(
				"3",
				pane3[0] + pane3[2] - 1,
				pane3[1] + pane3[3] - 1,
				12,
				8
			);

			terminal.draw();

			requestAnimationFrame(draw);
		};

		requestAnimationFrame(draw);
	} catch (err: Error) {
		console.error(err);
	}
};

await main();
