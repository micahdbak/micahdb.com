import { Terminal } from "./terminal.ts";

const TEXT =
	"SYSTEM ALERT\n\nStatus: STABLE\nCortex: LINKED\n\nWelcome, Operator.";

const main = async () => {
	const canvas = document.getElementById("webgl") as HTMLCanvasElement;

	try {
		const terminal = new Terminal(canvas);
		await terminal.init();

		const f = () => {
			terminal.clear();
			terminal.drawBox(5, 10, 10, 35, [0.0, 0.2, 0.4], [0.1, 0.1, 0.1], true);
			terminal.drawText(
				"root@micahdb.com: ~ ",
				6,
				12,
				[0.0, 0.2, 0.4],
				[1.0, 1.0, 1.0]
			);
			terminal.drawText(TEXT, 8, 12, [0.0, 0.2, 0.4], [0.0, 1.0, 0.8]);
			terminal.draw();
			requestAnimationFrame(f);
		};

		requestAnimationFrame(f);
	} catch (err: Error) {
		console.error(err);
	}
};

await main();
