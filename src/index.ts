import { Terminal } from "./terminal.ts";

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

/*
Useful Chars:
┓ ┏ ┛ ┗ ┃ ━
▄ ▀ ▐ ▌
█ ▓ ▒ ░
*/

const main = async () => {
	const canvas = document.getElementById("webgl") as HTMLCanvasElement;

	try {
		const terminal = new Terminal(canvas);
		await terminal.init();

		terminal.setPalette(new Float32Array(PALETTE.map((e) => e / 0xff)));

		const draw = () => {
			terminal.clear();

			const centerY = Math.floor(terminal.rows / 2);
			const centerX = Math.floor(terminal.cols / 2);
			const boxOffY = 9;
			const boxOffX = 24;

			terminal.drawBox(
				centerY - boxOffY,
				centerX - boxOffX,
				boxOffY * 2,
				boxOffX * 2,
				16,
				4,
				15,
				0,
				true
			);

			terminal.drawText(
				" Micah Baker ",
				centerY - boxOffY,
				centerX - 7,
				15,
				16,
				0,
				0,
				false
			);

			terminal.drawText(
				ASCII_ART,
				centerY - boxOffY + 2,
				centerX - 10,
				4,
				11,
				0,
				0,
				false
			);

			terminal.drawText(
				"Software Developer\nVancouver, BC, Canada",
				centerY - 5,
				centerX - boxOffX + 4,
				15,
				16,
				0,
				0,
				false
			);

			const r = centerY + boxOffY - 3;
			let c = centerX - boxOffX + 5;
			const items = [" Education ", " Experience ", " Projects "];

			for (let i = 0; i < items.length; i++) {
				const itemEnd = c + items[i].length;
				let bg = 8;
				let fg = 15;

				if (
					terminal.mouseCol >= c &&
					terminal.mouseCol < itemEnd &&
					terminal.mouseRow == r
				) {
					bg = 15;
					fg = 8;
				}

				terminal.drawText(items[i], r, c, bg, fg, 4, 0, true);
				c = itemEnd + 2;
			}

			terminal.draw();
			requestAnimationFrame(draw);
		};

		requestAnimationFrame(draw);
	} catch (err: Error) {
		console.error(err);
	}
};

await main();
