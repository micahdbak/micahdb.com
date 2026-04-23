import { Terminal } from "./terminal.ts";

const TEXT =
	"root@micahdb.com ~ $ cat main.c\n" +
	"#include <stdio.h>\n" +
	"int main(void) {\n" +
	'\tprintf("Hello, world!\\n");\n' +
	"}\n" +
	"root@micahdb.com ~ $ cc main.c\n" +
	"root@micahdb.com ~ $ ./a.out\n" +
	"Hello, world!";

const ASCII_ART =
	"░░░░░█▐▓▓░████▄▄▄█▀▄▓▓▓▌█\n" +
	"░░░░░▄█▌▀▄▓▓▄▄▄▄▀▀▀▄▓▓▓▓▓▌█\n" +
	"░░░▄█▀▀▄▓█▓▓▓▓▓▓▓▓▓▓▓▓▀░▓▌█\n" +
	"░░█▀▄▓▓▓███▓▓▓███▓▓▓▄░░▄▓▐█▌\n" +
	"░█▌▓▓▓▀▀▓▓▓▓███▓▓▓▓▓▓▓▄▀▓▓▐█\n" +
	"▐█▐██▐░▄▓▓▓▓▓▀▄░▀▓▓▓▓▓▓▓▓▓▌█▌\n" +
	"█▌███▓▓▓▓▓▓▓▓▐░░▄▓▓███▓▓▓▄▀▐█\n" +
	"█▐█▓▀░░▀▓▓▓▓▓▓▓▓▓██████▓▓▓▓▐█\n" +
	"▌▓▄▌▀░▀░▐▀█▄▓▓██████████▓▓▓▌█▌\n" +
	"▌▓▓▓▄▄▀▀▓▓▓▀▓▓▓▓▓▓▓▓█▓█▓█▓▓▌█▌\n" +
	"█▐▓▓▓▓▓▓▄▄▄▓▓▓▓▓▓█▓█▓█▓";

const main = async () => {
	const canvas = document.getElementById("webgl") as HTMLCanvasElement;

	try {
		const terminal = new Terminal(canvas);
		await terminal.init();

		const f = () => {
			terminal.clear();
			terminal.drawBox(5, 10, 10, 35, [0, 0, 0], [0.0, 0.2, 0.6], true);
			terminal.drawText(TEXT, 6, 12, [0, 0, 0], [0.2, 0.75, 0.2]);
			terminal.drawText(ASCII_ART, 4, 48, [0, 0, 0], [0.9, 0.7, 0.5]);
			terminal.draw();
			requestAnimationFrame(f);
		};

		requestAnimationFrame(f);
	} catch (err: Error) {
		console.error(err);
	}
};

await main();
