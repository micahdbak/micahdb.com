import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PALETTE } from "@/palette.ts";

const OUTPUT_DIR = "build";

function hex(colour: readonly [number, number, number]): string {
	return "#" + colour.map((channel) => channel.toString(16).padStart(2, "0")).join("");
}

/** The palette classes the canvas uses to colour text and backgrounds. */
function generatePaletteCss(): string {
	const rules: string[] = [];

	for (const [i, colour] of PALETTE.colours.entries()) {
		const value = hex(colour);

		rules.push(`.f${i} { color: ${value}; }`);
		rules.push(`.b${i} { background-color: ${value}; }`);
	}

	return rules.join("\n") + "\n";
}

function main() {
	mkdirSync(OUTPUT_DIR, { recursive: true });
	const css_path = join(OUTPUT_DIR, "palette.css");

	writeFileSync(css_path, generatePaletteCss());
	console.log(`generated ${css_path}`);
}

if (import.meta.main) {
	main();
}
