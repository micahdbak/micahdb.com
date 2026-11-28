import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as tscon from "@micahdb/tscon";
import { PALETTE } from "@/palette.ts";

const OUTPUT_DIR = "build";
const JETBRAINS_MONO_ADVANCE = 0.6;

function hex(colour: readonly [number, number, number]): string {
	return "#" + colour.map((channel) => channel.toString(16).padStart(2, "0")).join("");
}

function colourName(index: number): string {
	return tscon.Colour[index]!.toLowerCase().replaceAll("_", "-");
}

/** The stylesheet tscon pages use for palette colours and cell sizing. */
function generateCss(): string {
	const root: string[] = [":root {"];
	const classes: string[] = [];

	root.push(`\t--cell-width: ${tscon.Canvas.CELL_WIDTH}px;`);
	root.push(`\t--cell-height: ${tscon.Canvas.CELL_HEIGHT}px;`);
	root.push(`\t--cell-size: calc(var(--cell-width) / ${JETBRAINS_MONO_ADVANCE});`);
	root.push("");

	for (const [i, colour] of PALETTE.colours.entries()) {
		const value = hex(colour);
		const name = colourName(i);

		root.push(`\t--${name}: ${value};`);
		classes.push(`.f${i} { color: var(--${name}); }`);
		classes.push(`.b${i} { background-color: var(--${name}); }`);
	}

	root.push("}");

	return [...root, "", ...classes].join("\n") + "\n";
}

function main() {
	mkdirSync(OUTPUT_DIR, { recursive: true });
	const css_path = join(OUTPUT_DIR, "tscon.css");

	writeFileSync(css_path, generateCss());
	console.log(`generated ${css_path}`);
}

if (import.meta.main) {
	main();
}
