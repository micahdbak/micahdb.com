import { Renderer } from "./renderer.ts";

class Glyph {
	static readonly WIDTH = 96;
	static readonly HEIGHT = 211;
	static readonly WTOH_RATIO = Glyph.HEIGHT / Glyph.WIDTH;
	static readonly VERTICES = 6;

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
	static readonly CELL_SIZE = 11;
	static readonly BYTES_PER_GLYPH = Glyph.VERTICES * Renderer.STRIDE;
	static readonly UINT32_PER_GLYPH = Glyph.VERTICES;

	private renderer: Renderer;

	private mouseX: number;
	private mouseY: number;

	private cellWidth: number;
	private cellHeight: number;

	private cols: number;
	private rows: number;

	private data: Uint32Array;

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

	drawText(text: string, row: number, col: number, bg: number, fg: number) {
		let r = row;
		let c = col;
		let i = 0;

		while (r < this.rows && i < text.length) {
			const charCode = text.charCodeAt(i);

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

			if (c >= this.cols) {
				i++;

				continue;
			}

			const glyphIndex = r * this.cols + c;
			const uint32Index = glyphIndex * Terminal.UINT32_PER_GLYPH;

			const glyph = new Glyph(bg, fg, text.charCodeAt(i));

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
		colour: number,
		shadowColour: number,
		shadow: boolean
	) {
		for (let r = row; r <= row + h && r < this.rows; r++) {
			for (let c = col; c <= col + w && c < this.cols; c++) {
				const shadowRegion: boolean = r === row + h || c === col + w;
				const shadowGap: boolean =
					(r === row + h && c === col) || (c === col + w && r === row);

				if ((!shadow && shadowRegion) || shadowGap) {
					continue;
				}

				const glyphIndex = r * this.cols + c;
				const uint32Index = glyphIndex * Terminal.UINT32_PER_GLYPH;

				let charCode = 0;
				let fgColour = 8;
				let bgColour = colour;

				if (shadow && shadowRegion) {
					bgColour = shadowColour;
					fgColour = 0;
					charCode = "░".codePointAt(0);
				} else {
					const edgeChars = "┓┏┛┗┃━";
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

				const glyph = new Glyph(bgColour, fgColour, charCode);

				this.data.set(glyph.data(), uint32Index);
			}
		}
	}

	draw() {
		// highlight mouse cursor
		if (this.mouseX || this.mouseY) {
			let col = Math.floor(this.mouseX / this.cellWidth);
			let row = Math.floor(this.mouseY / this.cellHeight);

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
			const bgColour = glyph.bgColour;
			glyph.bgColour = glyph.fgColour;
			glyph.fgColour = bgColour;

			if (glyph.bgColour === glyph.fgColour) {
				if (glyph.bgColour < 15) {
					glyph.bgColour = 15;
				} else {
					glyph.bgColour = 0;
				}
			}

			this.data.set(glyph.data(), uint32Index);
		}

		this.renderer.setData(this.data);
		this.renderer.draw();
	}
}

export { Terminal };
