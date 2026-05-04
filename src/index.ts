import { Terminal } from "./terminal.ts";
import { File, Folder, FileTree } from "./file_tree.ts";

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
┐ ┌ ┘ └ │ ─ ├
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

		terminal.setPalette(new Float32Array(PALETTE.map((e) => e / 0xff)));

		const file_tree = new FileTree(terminal, ROOT);

		const draw = () => {
			terminal.clear();

			const centerY = Math.floor(terminal.rows / 2);
			const centerX = Math.floor(terminal.cols / 2);
			const boxOffY = 12;
			const boxOffX = 24;

			terminal.drawBox(
				centerY - boxOffY,
				centerX - boxOffX,
				boxOffY * 2,
				boxOffX * 2,
				16,
				0,
				15,
				0,
				false
			);

			file_tree.draw(
				centerY - boxOffY + 2,
				centerX - boxOffX + 2,
				2 * boxOffY - 4,
				2 * boxOffX - 4
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
