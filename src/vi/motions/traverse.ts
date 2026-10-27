import type { Buffer } from "../buffer.ts";
import { Pos } from "../buffer.ts";

export function prevChar(buffer: Buffer, position: Pos): Pos | null {
	if (position.col > 0) {
		return new Pos(position.line, position.col - 1);
	}

	if (position.line > 0) {
		return buffer.lastCol(position.line - 1);
	}

	return null;
}

export function nextChar(buffer: Buffer, position: Pos): Pos | null {
	if (position.col < buffer.lineLength(position.line) - 1) {
		return new Pos(position.line, position.col + 1);
	}

	if (position.line < buffer.lineCount() - 1) {
		return new Pos(position.line + 1, 0);
	}

	return null;
}

export function isEmptyLineAt(buffer: Buffer, position: Pos): boolean {
	return position.col === 0 && buffer.isEmptyLine(position.line);
}
