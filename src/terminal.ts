import { Renderer } from "./renderer.ts";
import { Glyph } from "./glyph.ts";
import { Colour } from "./colour.ts";

class Terminal {
	static readonly CELL_SIZE = 8;
	static readonly BYTES_PER_GLYPH = Glyph.VERTICES * Renderer.STRIDE;
	static readonly UINT32_PER_GLYPH = Glyph.VERTICES;

	private renderer: Renderer;

	private mouseX: number;
	private mouseY: number;

	private data: Uint32Array;

	public cols: number;
	public rows: number;

	public cellWidth: number;
	public cellHeight: number;

	public programRow: number;
	public programCol: number;
	public programRows: number;
	public programCols: number;

	public mouseCol: number;
	public mouseRow: number;
	public mouseDownRow: number;
	public mouseDownCol: number;
	public mouseClick: boolean;
	public mouseDown: boolean;
	public mouseOwner: string = "";

	public detailText: string = "";

	constructor(
		canvas: HTMLCanvasElement,
		logMessage: (source: string, message: string) => void
	) {
		this.renderer = new Renderer(canvas, logMessage);
	}

	async init() {
		await this.renderer.init();

		this.programRow = 0;
		this.programCol = 0;
		this.programRows = 0;
		this.programCols = 0;

		this.resize(0, 0, 1, 1);

		window.addEventListener("resize", () => {
			this.resize(
				this.programRow,
				this.programCol,
				this.programRows,
				this.programCols
			);
		});

		window.addEventListener("pointermove", (e) => {
			const dpr = window.devicePixelRatio || 1;
			this.mouseX = dpr * e.clientX;
			this.mouseY = dpr * e.clientY;
			this.mouseRow = Math.floor(this.mouseY / this.cellHeight);
			this.mouseCol = Math.floor(this.mouseX / this.cellWidth);
		});

		this.renderer.canvas.addEventListener("pointerdown", (e: PointerEvent) => {
			const dpr = window.devicePixelRatio || 1;
			this.mouseX = dpr * e.clientX;
			this.mouseY = dpr * e.clientY;

			const row = Math.floor(this.mouseY / this.cellHeight);
			const col = Math.floor(this.mouseX / this.cellWidth);
			this.mouseRow = row;
			this.mouseCol = col;

			this.mouseDown = true;
			this.mouseDownRow = row;
			this.mouseDownCol = col;

			(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		});

		this.renderer.canvas.addEventListener("pointerup", () => {
			this.mouseDown = false;
			this.mouseClick = true;
		});

		this.renderer.canvas.addEventListener("pointercancel", () => {
			this.mouseDown = false;
		});

		this.renderer.canvas.addEventListener("pointerleave", () => {
			this.mouseDown = false;
		});

		this.mouseRow = 0;
		this.mouseCol = 0;
		this.mouseDownRow = 0;
		this.mouseDownCol = 0;
		this.mouseClick = false;
		this.mouseDown = false;
	}

	resize(vrow: number, vcol: number, vrows: number, vcols: number) {
		// keep track of these for reuse in windows resize events
		if (
			vrow !== this.programRow ||
			vcol !== this.programCol ||
			vrows !== this.programRows ||
			vcols !== this.programCols
		) {
			this.programRow = vrow;
			this.programCol = vcol;
			this.programRows = vrows;
			this.programCols = vcols;
		}

		const dpr = window.devicePixelRatio || 1;
		this.cellWidth = Terminal.CELL_SIZE * dpr;
		this.cellHeight = Glyph.WTOH_RATIO * this.cellWidth;

		const canvasWidth = Math.max(1, this.renderer.canvas.clientWidth * dpr);
		const canvasHeight = Math.max(1, this.renderer.canvas.clientHeight * dpr);

		const _cols = Math.floor(canvasWidth / this.cellWidth);
		const _rows = Math.floor(canvasHeight / this.cellHeight);

		// re-generate glyph buffer if rows/cols changed
		if (this.cols !== _cols || this.rows !== _rows) {
			this.cols = _cols;
			this.rows = _rows;

			const count = this.rows * this.cols * Terminal.UINT32_PER_GLYPH;
			this.data = new Uint32Array(count);
		}

		// update these so they are accurate to the stretched cells
		this.cellWidth = canvasWidth / this.cols;
		this.cellHeight = canvasHeight / this.rows;

		// if program dimensions are not set, default them to full screen
		if (this.programRows === 0) this.programRows = this.rows;
		if (this.programCols === 0) this.programCols = this.cols;

		this.renderer.resize(
			canvasWidth,
			canvasHeight,
			this.rows,
			this.cols,
			this.programRow,
			this.programCol,
			this.programRows,
			this.programCols
		);
	}

	clear() {
		this.data.fill(0);
		document.body.className = "";
	}

	drawText(
		text: string,
		row: number,
		col: number,
		backColour: Colour,
		fgColour: Colour,
		bgColour: Colour = Colour.BLACK,
		shadowColour: Colour = Colour.BLACK,
		shadow: boolean = false,
		fontOffset: number = Glyph.NORMAL_FONT
	) {
		row = Math.round(row);
		col = Math.round(col);

		const textLength = text.length;

		// don't display shadow for multi-line text
		if (shadow) {
			if (text.includes("\n") || text.includes("\t")) {
				shadow = false;
			} else {
				const shadow = "▀".repeat(textLength);
				text = text + "▄\n " + shadow;
			}
		}

		let r = row;
		let c = col;
		let i = 0;

		while (r < this.rows && i < text.length) {
			const charCode = text.charCodeAt(i);
			let bg = backColour;
			let fg = fgColour;

			if (charCode === "\n".charCodeAt(0)) {
				c = col;
				r++;
				i++;
				continue;
			}

			if (charCode === "\t".charCodeAt(0)) {
				c += 4;
				i++;
				continue;
			}

			if (shadow && (i >= textLength || r > row)) {
				bg = bgColour;
				fg = shadowColour;
			}

			if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) {
				const glyphIndex = r * this.cols + c;
				const uint32Index = glyphIndex * Terminal.UINT32_PER_GLYPH;

				const off = charCode < 33 ? 0 : fontOffset;
				const glyph = new Glyph(bg, fg, charCode + off);
				this.data.set(glyph.data(), uint32Index);
			}

			c++;
			i++;
		}
	}

	drawBox(
		row: number,
		col: number,
		h: number,
		w: number,
		bgColour: Colour,
		backColour: Colour,
		borderColour: Colour,
		shadowColour: Colour,
		shadow: boolean
	) {
		const rStart = Math.max(0, row);
		const rEnd = Math.min(this.rows - 1, row + h);
		const cStart = Math.max(0, col);
		const cEnd = Math.min(this.cols - 1, col + w);

		for (let r = rStart; r <= rEnd; r++) {
			for (let c = cStart; c <= cEnd; c++) {
				const shadowRegion: boolean = r === row + h || c === col + w;
				const shadowGap: boolean = r === row + h && c === col;

				if (!shadow && shadowRegion) {
					continue;
				}

				const glyphIndex = r * this.cols + c;
				const uint32Index = glyphIndex * Terminal.UINT32_PER_GLYPH;

				let charCode = 1; // empty char
				let bg = backColour;
				let fg = borderColour;

				if (shadow && shadowRegion) {
					if (!shadowGap) {
						charCode =
							r == row + h
								? "▀".codePointAt(0)
								: c === col + w && r === row
									? "▄".codePointAt(0)
									: "█".codePointAt(0);

						bg = bgColour;
						fg = shadowColour;
					} else {
						charCode = "█".codePointAt(0);
						bg = shadowColour;
						fg = bgColour;
					}
				} else {
					const edgeChars = "┐┌┘└│─"; // borders
					if (r === row && c === col) charCode = edgeChars.codePointAt(1);
					else if (r === row && c === col + w - 1)
						charCode = edgeChars.codePointAt(0);
					else if (r === row + h - 1 && c === col)
						charCode = edgeChars.codePointAt(3);
					else if (r === row + h - 1 && c === col + w - 1)
						charCode = edgeChars.codePointAt(2);
					else if (r === row || r === row + h - 1)
						charCode = edgeChars.codePointAt(5);
					else if (c === col || c === col + w - 1)
						charCode = edgeChars.codePointAt(4);
				}

				const glyph = new Glyph(bg, fg, charCode);
				this.data.set(glyph.data(), uint32Index);
			}
		}
	}

	mouseAt(row: number, col: number, rows: number, cols: number) {
		return (
			this.mouseRow >= row &&
			this.mouseRow < row + rows &&
			this.mouseCol >= col &&
			this.mouseCol < col + cols
		);
	}

	mouseDownAt(row: number, col: number, rows: number, cols: number) {
		return (
			this.mouseDownRow >= row &&
			this.mouseDownRow < row + rows &&
			this.mouseDownCol >= col &&
			this.mouseDownCol < col + cols
		);
	}

	draw() {
		// highlight mouse cursor
		if (this.mouseCol !== undefined && this.mouseRow !== undefined) {
			if (this.mouseCol < 0) {
				this.mouseCol = 0;
			} else if (this.mouseCol >= this.cols) {
				this.mouseCol = this.cols - 1;
			}

			if (this.mouseRow < 0) {
				this.mouseRow = 0;
			} else if (this.mouseRow >= this.rows) {
				this.mouseRow = this.rows - 1;
			}

			const glyphIndex = this.mouseRow * this.cols + this.mouseCol;
			const uint32Index = glyphIndex * Terminal.UINT32_PER_GLYPH;

			const cellData = this.data.subarray(
				uint32Index,
				uint32Index + Terminal.UINT32_PER_GLYPH
			);
			const glyph = Glyph.fromData(cellData);

			if (this.mouseDown) {
				glyph.bgColour = Colour.RED;
				glyph.fgColour = Colour.LIGHT_BLUE;
			} else {
				const bgColour = glyph.bgColour;
				glyph.bgColour = glyph.fgColour;
				glyph.fgColour = bgColour;
			}

			if (glyph.bgColour === glyph.fgColour) {
				if (glyph.bgColour < Colour.WHITE) {
					glyph.bgColour = Colour.WHITE;
				} else {
					glyph.bgColour = Colour.BLACK;
				}
			}

			this.data.set(glyph.data(), uint32Index);
		}

		this.mouseClick = false;

		if (this.detailText.length > 0) {
			this.drawText(
				this.detailText,
				this.rows - 1,
				0,
				Colour.BLACK,
				Colour.WHITE
			);
			this.detailText = "";
		}

		this.renderer.setData(this.data);
		this.renderer.draw();
	}
}

export { Terminal };
