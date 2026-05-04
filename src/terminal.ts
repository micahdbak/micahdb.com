import { Renderer } from "./renderer.ts";

class Glyph {
	static readonly WIDTH = 96;
	static readonly HEIGHT = 211;
	static readonly WTOH_RATIO = Glyph.HEIGHT / Glyph.WIDTH;
	static readonly VERTICES = 6;

	static readonly ASCII_START = 33;
	static readonly ASCII_END = 126;
	static readonly ASCII_COUNT = Glyph.ASCII_END - Glyph.ASCII_START + 1;

	static readonly NORMAL_FONT = 0;
	static readonly BOLD_FONT = 1 * Glyph.ASCII_COUNT;
	static readonly ITALIC_FONT = 2 * Glyph.ASCII_COUNT;
	static readonly ITALIC_BOLD_FONT = 3 * Glyph.ASCII_COUNT;

	public bgColour: number;
	public fgColour: number;
	public charCode: number;

	constructor(
		public bgColour: number,
		public fgColour: number,
		public charCode: number
	) {
		this.bgColour = bgColour;
		this.fgColour = fgColour;
		this.charCode = charCode;
	}

	data(): Uint32Array {
		// Uint32 containing bgColour (1 byte), fgColour (1 byte), charCode (2 bytes)
		const packed =
			(this.bgColour & 0xff) |
			((this.fgColour & 0xff) << 8) |
			((this.charCode & 0xffff) << 16);
		return new Uint32Array(Glyph.VERTICES).fill(packed);
	}

	static fromData(data: Uint32Array): Glyph {
		const packed = data[0];
		return new Glyph(
			packed & 0xff,
			(packed >> 8) & 0xff,
			(packed >> 16) & 0xffff
		);
	}
}

class Terminal {
	static readonly CELL_SIZE = 10;
	static readonly BYTES_PER_GLYPH = Glyph.VERTICES * Renderer.STRIDE;
	static readonly UINT32_PER_GLYPH = Glyph.VERTICES;

	private renderer: Renderer;

	private mouseX: number;
	private mouseY: number;

	private cellWidth: number;
	private cellHeight: number;

	private data: Uint32Array;

	public cols: number;
	public rows: number;

	public mouseCol: number;
	public mouseRow: number;
	public mouseClick: boolean;
	public mouseDown: boolean;

	constructor(canvas: HTMLCanvasElement) {
		this.renderer = new Renderer(canvas);
	}

	async init() {
		await this.renderer.init();
		this.resize();

		window.addEventListener("resize", () => {
			this.resize();
		});

		window.addEventListener("pointermove", (e) => {
			const dpr = window.devicePixelRatio || 1;
			this.mouseX = dpr * e.clientX;
			this.mouseY = dpr * e.clientY;
		});

		this.renderer.canvas.addEventListener("click", () => {
			this.mouseClick = true;
		});

		this.renderer.canvas.addEventListener("mousedown", () => {
			this.mouseDown = true;
		});

		this.renderer.canvas.addEventListener("mouseup", () => {
			this.mouseDown = false;
		});

		this.mouseCol = 0;
		this.mouseRow = 0;
		this.mouseClick = false;
		this.mouseDown = false;
	}

	resize() {
		const dpr = window.devicePixelRatio || 1;
		this.cellWidth = Terminal.CELL_SIZE * dpr;
		this.cellHeight = Glyph.WTOH_RATIO * this.cellWidth;

		const canvasWidth = this.renderer.canvas.clientWidth * dpr;
		const canvasHeight = this.renderer.canvas.clientHeight * dpr;

		this.cols = Math.floor(canvasWidth / this.cellWidth);
		this.rows = Math.floor(canvasHeight / this.cellHeight);

		// update these so they are accurate to the stretched cells
		this.cellWidth = canvasWidth / this.cols;
		this.cellHeight = canvasHeight / this.rows;

		const count = this.rows * this.cols * Terminal.UINT32_PER_GLYPH;
		this.data = new Uint32Array(count);

		this.renderer.resize(canvasWidth, canvasHeight, this.rows, this.cols);
	}

	clear() {
		this.data.fill(0);
	}

	drawText(
		text: string,
		row: number,
		col: number,
		backColour: number,
		fgColour: number,
		bgColour: number,
		shadowColour: number,
		shadow: boolean,
		fontOffset: number
	) {
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

			if (c >= this.cols || c < 0 || r < 0) {
				i++;
				continue;
			}

			if (r >= this.rows) {
				break;
			}

			if (shadow && (i >= textLength || r > row)) {
				bg = bgColour;
				fg = shadowColour;
			}

			const glyphIndex = r * this.cols + c;
			const uint32Index = glyphIndex * Terminal.UINT32_PER_GLYPH;

			const off = text.charCodeAt(i) < 33 ? 0 : fontOffset;
			const glyph = new Glyph(bg, fg, text.charCodeAt(i) + off);
			this.data.set(glyph.data(), uint32Index);

			c++;
			i++;
		}
	}

	setPalette(palette: Float32Array) {
		this.renderer.setPalette(palette);
	}

	drawBox(
		row: number,
		col: number,
		h: number,
		w: number,
		bgColour: number,
		backColour: number,
		borderColour: number,
		shadowColour: number,
		shadow: boolean
	) {
		for (let r = row; r <= row + h && r < this.rows; r++) {
			for (let c = col; c <= col + w && c < this.cols; c++) {
				if (c < 0 || r < 0) {
					continue;
				}

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

	mouseAt(row, col, len) {
		return (
			this.mouseRow === row && this.mouseCol >= col && this.mouseCol < col + len
		);
	}

	draw() {
		// highlight mouse cursor
		if (this.mouseCol !== undefined && this.mouseRow !== undefined) {
			let col = Math.floor(this.mouseX / this.cellWidth);
			let row = Math.floor(this.mouseY / this.cellHeight);
			this.mouseCol = col;
			this.mouseRow = row;

			if (col < 0) {
				col = 0;
			} else if (col >= this.cols) {
				col = this.cols - 1;
			}

			if (row < 0) {
				row = 0;
			} else if (row >= this.rows) {
				row = this.rows - 1;
			}

			const glyphIndex = row * this.cols + col;
			const uint32Index = glyphIndex * Terminal.UINT32_PER_GLYPH;

			const cellData = this.data.subarray(
				uint32Index,
				uint32Index + Terminal.UINT32_PER_GLYPH
			);
			const glyph = Glyph.fromData(cellData);

			if (this.mouseDown) {
				glyph.bgColour = 1; // red
				glyph.fgColour = 13; // purple
			} else {
				const bgColour = glyph.bgColour;
				glyph.bgColour = glyph.fgColour;
				glyph.fgColour = bgColour;
			}

			if (glyph.bgColour === glyph.fgColour) {
				if (glyph.bgColour < 15) {
					glyph.bgColour = 15;
				} else {
					glyph.bgColour = 0;
				}
			}

			this.data.set(glyph.data(), uint32Index);
		}

		this.mouseClick = false;

		this.renderer.setData(this.data);
		this.renderer.draw();
	}
}

export { Glyph, Terminal };
