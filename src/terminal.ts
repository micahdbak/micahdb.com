import { Renderer } from "./renderer.ts";

class Glyph {
	static readonly WIDTH = 154;
	static readonly HEIGHT = 338;
	static readonly WTOH_RATIO = Glyph.HEIGHT / Glyph.WIDTH;
	static readonly ATLAS_WIDTH = 4096;
	static readonly ATLAS_HEIGHT = 4096;
	static readonly ATLAS_COLS = Math.floor(Glyph.ATLAS_WIDTH / Glyph.WIDTH);
	static readonly VERTICES = 6;

	public bgColour: [number, number, number];
	public fgColour: [number, number, number];
	public charCode: number;

	// charCode: in range ['!' (33), '~' (126)] or empty glyph otherwise
	constructor(
		bgColour: [number, number, number],
		fgColour: [number, number, number],
		charCode: number
	) {
		this.bgColour = bgColour;
		this.fgColour = fgColour;
		this.charCode = charCode;
	}

	data(position: [number, number], width: number, height: number): number[] {
		const tl = Glyph.topLeft(this.charCode);
		const br = [tl[0] + Glyph.WIDTH, tl[1] + Glyph.HEIGHT];

		const uvMin = [tl[0] / Glyph.ATLAS_WIDTH, tl[1] / Glyph.ATLAS_HEIGHT];
		const uvMax = [br[0] / Glyph.ATLAS_WIDTH, br[1] / Glyph.ATLAS_HEIGHT];

		// positions of each vertex
		const p0 = position;
		const p1 = [position[0], position[1] + height];
		const p2 = [position[0] + width, position[1] + height];
		const p3 = [position[0] + width, position[1]];

		// vertex data
		const v0 = [...p0, ...this.bgColour, ...this.fgColour, ...uvMin];
		const v1 = [...p1, ...this.bgColour, ...this.fgColour, uvMin[0], uvMax[1]];
		const v2 = [...p2, ...this.bgColour, ...this.fgColour, ...uvMax];
		const v3 = [...p3, ...this.bgColour, ...this.fgColour, uvMax[0], uvMin[1]];

		// two triangles, composed of the computed vertices
		return [...v0, ...v1, ...v3, ...v1, ...v2, ...v3];
	}

	static topLeft(charCode: number): [number, number] {
		// 33: '!', 126: '~'; range of [renderable] ASCII characters
		if (charCode < 33 || charCode > 126) {
			return [0, 0]; // empty glyph
		}

		const i = charCode - 33 + 1;
		const x = (i % Glyph.ATLAS_COLS) * Glyph.WIDTH;
		const y = Math.floor(i / Glyph.ATLAS_COLS) * Glyph.HEIGHT;

		return [x, y];
	}

	static fromData(data: Float32Array): Glyph {
		// extract bgColour and fgColour by index
		const bgColour = [data[2], data[3], data[4]];
		const fgColour = [data[5], data[6], data[7]];

		// the first vertex is in the top left of the glyph
		// the UV coordinates for this vertex are all that's
		// needed to find which character this glyph is
		const u = data[8];
		const v = data[9];

		const col = Math.round((u * Glyph.ATLAS_WIDTH) / Glyph.WIDTH);
		const row = Math.round((v * Glyph.ATLAS_HEIGHT) / Glyph.HEIGHT);
		const i = row * Glyph.ATLAS_COLS + col;
		const charCode = i + 32;

		return new Glyph(bgColour, fgColour, charCode);
	}
}

class Terminal {
	static readonly CELL_SIZE = 10;
	static readonly FLOATS_PER_GLYPH = Glyph.VERTICES * (Renderer.STRIDE / 4);

	private renderer: Renderer;

	private mouseX: number;
	private mouseY: number;

	private cellWidth: number;
	private cellHeight: number;

	private cols: number;
	private rows: number;

	private data: Float32Array;

	constructor(canvas: HTMLCanvasElement) {
		this.renderer = new Renderer(canvas);
	}

	async init() {
		await this.renderer.init();
		this.resize(); // populates this.glyphs

		window.addEventListener("resize", () => {
			this.renderer.updateProjectionMatrix();
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

		this.cols = Math.floor(this.renderer.canvasWidth / this.cellWidth);
		this.rows = Math.floor(this.renderer.canvasHeight / this.cellHeight);

		const count = this.rows * this.cols * Terminal.FLOATS_PER_GLYPH;
		this.data = new Float32Array(count);
	}

	clear() {
		this.data.fill(0);
	}

	drawText(
		text: string,
		row: number,
		col: number,
		bg: [number, number, number],
		fg: [number, number, number]
	) {
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

			const x = c * this.cellWidth;
			const y = r * this.cellHeight;

			const glyphIndex = r * this.cols + c;
			const floatIndex = glyphIndex * Terminal.FLOATS_PER_GLYPH;

			const glyph = new Glyph(bg, fg, text.charCodeAt(i));

			this.data.set(
				glyph.data([x, y], this.cellWidth, this.cellHeight),
				floatIndex
			);

			c++;
			i++;
		}
	}

	drawBox(
		row: number,
		col: number,
		h: number,
		w: number,
		colour: [number, number, number],
		shadowColour: [number, number, number],
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

				const x = c * this.cellWidth;
				const y = r * this.cellHeight;

				const glyphIndex = r * this.cols + c;
				const floatIndex = glyphIndex * Terminal.FLOATS_PER_GLYPH;

				const glyph = new Glyph(
					shadow && shadowRegion ? shadowColour : colour,
					[1, 1, 1],
					0
				);

				this.data.set(
					glyph.data([x, y], this.cellWidth, this.cellHeight),
					floatIndex
				);
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

			const x = col * this.cellWidth;
			const y = row * this.cellHeight;

			const glyphIndex = row * this.cols + col;
			const floatIndex = glyphIndex * Terminal.FLOATS_PER_GLYPH;

			const cellData = this.data.subarray(
				floatIndex,
				floatIndex + Terminal.FLOATS_PER_GLYPH
			);
			const glyph = Glyph.fromData(cellData);
			glyph.bgColour = [1, 1, 1];
			glyph.fgColour = [0, 0, 0];

			this.data.set(
				glyph.data([x, y], this.cellWidth, this.cellHeight),
				floatIndex
			);
		}

		this.renderer.setData(this.data);
		this.renderer.draw();
	}
}

export { Terminal };
