export class Pos {
	line: number;
	col: number;

	constructor(line: number, col: number) {
		this.line = line;
		this.col = col;
	}

	before(other: Pos): boolean {
		return this.line < other.line || (this.line === other.line && this.col < other.col);
	}

	after(other: Pos): boolean {
		return other.before(this);
	}

	equals(other: Pos): boolean {
		return this.line === other.line && this.col === other.col;
	}

	withLine(line: number): Pos {
		return new Pos(line, this.col);
	}

	withCol(col: number): Pos {
		return new Pos(this.line, col);
	}

	// the position reached after moving through text, which may contain
	// newlines
	advancedBy(text: string): Pos {
		const parts = text.split("\n");

		if (parts.length === 1) {
			return new Pos(this.line, this.col + text.length);
		}

		return new Pos(this.line + parts.length - 1, parts[parts.length - 1]!.length);
	}
}

export class Range {
	start: Pos;
	end: Pos;
	linewise: boolean;

	constructor(start: Pos, end: Pos, linewise: boolean) {
		this.start = start;
		this.end = end;
		this.linewise = linewise;
	}

	// a copy with the endpoints ordered, start before end
	normalized(): Range {
		if (this.start.before(this.end) || this.start.equals(this.end)) {
			return new Range(this.start, this.end, this.linewise);
		}

		return new Range(this.end, this.start, this.linewise);
	}
}

export function isBlank(ch: string | undefined): boolean {
	return ch === undefined || ch === " " || ch === "\t";
}

export class Buffer {
	lines: string[];
	modified = false;

	constructor(text: string) {
		this.lines = text.split("\n");

		if (this.lines.length === 0) {
			this.lines = [""];
		}
	}

	lineCount(): number {
		return this.lines.length;
	}

	lineText(line: number): string {
		return this.lines[line] ?? "";
	}

	lineLength(line: number): number {
		return this.lineText(line).length;
	}

	charAt(position: Pos): string | undefined {
		return this.lineText(position.line)[position.col];
	}

	isBlankAt(position: Pos): boolean {
		return isBlank(this.charAt(position));
	}

	lastCol(line: number): Pos {
		return new Pos(line, Math.max(0, this.lineLength(line) - 1));
	}

	endOfLine(line: number): Pos {
		return new Pos(line, this.lineLength(line));
	}

	firstNonBlank(line: number): Pos {
		const text = this.lineText(line);

		for (const [col, ch] of [...text].entries()) {
			if (!isBlank(ch)) {
				return new Pos(line, col);
			}
		}

		return new Pos(line, 0);
	}

	isEmptyLine(line: number): boolean {
		return this.lineLength(line) === 0;
	}

	textOf(range: Range): string {
		const { start, end, linewise } = range.normalized();

		if (linewise) {
			return this.lines.slice(start.line, end.line + 1).join("\n") + "\n";
		}

		if (start.line === end.line) {
			return this.lineText(start.line).slice(start.col, end.col);
		}

		const first = this.lineText(start.line).slice(start.col);
		const middle = this.lines.slice(start.line + 1, end.line);
		const last = this.lineText(end.line).slice(0, end.col);

		return [first, ...middle, last].join("\n");
	}

	insert(at: Pos, text: string): void {
		const [first, ...rest] = text.split("\n");
		const line = this.lineText(at.line);
		const tail = line.slice(at.col);

		this.lines[at.line] = line.slice(0, at.col) + first + (rest.length > 0 ? "" : tail);

		for (const [index, part] of rest.entries()) {
			const is_last = index === rest.length - 1;
			this.lines.splice(at.line + 1 + index, 0, part + (is_last ? tail : ""));
		}

		this.modified = true;
	}

	remove(range: Range): void {
		const { start, end, linewise } = range.normalized();

		if (linewise) {
			this.lines.splice(start.line, end.line - start.line + 1);

			if (this.lines.length === 0) {
				this.lines = [""];
			}
		} else if (start.line === end.line) {
			const line = this.lineText(start.line);
			this.lines[start.line] = line.slice(0, start.col) + line.slice(end.col);
		} else {
			const first = this.lineText(start.line).slice(0, start.col);
			const last = this.lineText(end.line).slice(end.col);
			this.lines.splice(start.line, end.line - start.line + 1, first + last);
		}

		this.modified = true;
	}

	replace(range: Range, text: string): void {
		const start = range.normalized().start;

		this.remove(range);
		this.insert(start, text);
	}

	splitLine(at: Pos): void {
		const line = this.lineText(at.line);
		this.lines.splice(at.line, 1, line.slice(0, at.col), line.slice(at.col));
		this.modified = true;
	}

	joinLine(line: number): void {
		if (line >= this.lineCount() - 1) {
			return;
		}

		const current = this.lineText(line);
		const next = this.lineText(line + 1).trimStart();
		const separator = current.length > 0 && !current.endsWith(" ") ? " " : "";

		this.lines.splice(line, 2, current + separator + next);
		this.modified = true;
	}
}
