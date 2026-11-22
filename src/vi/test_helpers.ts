import * as tscon from "@micahdb/tscon";

/**
 * A headless WebGL2 context that keeps the last cell framebuffer uploaded by
 * `Terminal.draw`, so view tests can assert on the rendered characters.
 */
export class RecordingGL extends tscon.HeadlessGL2 {
	cells: Uint32Array | null = null;
	private array_buffer: WebGLBuffer | null = null;
	private terminal_buffer: WebGLBuffer | null = null;

	override bindBuffer(target: number, buffer: WebGLBuffer | null): void {
		if (target === this.ARRAY_BUFFER) {
			this.array_buffer = buffer;
		}

		super.bindBuffer(target, buffer);
	}

	override vertexAttribIPointer(
		index: number,
		size: number,
		type: number,
		stride: number,
		offset: number
	): void {
		if (type === this.UNSIGNED_INT) {
			this.terminal_buffer = this.array_buffer;
		}

		super.vertexAttribIPointer(index, size, type, stride, offset);
	}


	override bufferData(
		target: number,
		data: ArrayBufferView | ArrayBuffer | null,
		usage: number
	): void {
		if (target === this.ARRAY_BUFFER && this.array_buffer === this.terminal_buffer
			&& data instanceof Uint32Array) {
			this.cells = data.slice();
		}

		super.bufferData(target, data, usage);
	}
}

/**
 * A renderer that records texture draws before forwarding them to the real
 * renderer and the headless GL context.
 */
export class RecordingRenderer extends tscon.Renderer {
	readonly draws: Array<{
		glyphs: tscon.TexGlyphs;
		texture: WebGLTexture;
		dst: tscon.Rect;
	}> = [];

	override draw(glyphs: tscon.TexGlyphs, texture: WebGLTexture, dst: tscon.Rect): void {
		this.draws.push({ glyphs, texture, dst: { ...dst } });
		super.draw(glyphs, texture, dst);
	}
}

export function makeCanvas(rows: number, cols: number) {
	const host = new tscon.TestCanvasHost({
		css_width: cols * tscon.Canvas.CELL_WIDTH,
		css_height: rows * tscon.Canvas.CELL_HEIGHT,
	});
	const gl = new RecordingGL();
	const canvas = new tscon.Canvas(host, gl as unknown as WebGL2RenderingContext);

	return { host, gl, canvas };
}

export function pointAtCell(
	host: tscon.TestCanvasHost,
	canvas: tscon.Canvas,
	row: number,
	col: number
) {
	return {
		x: ((col + 0.5) / canvas.cols) * host.css_width,
		y: ((row + 0.5) / canvas.rows) * host.css_height,
	};
}

export function screenCell(
	gl: RecordingGL,
	canvas: tscon.Canvas,
	row: number,
	col: number
): number {
	return gl.cells?.[row * canvas.cols + col] ?? 0;
}

export function screenText(
	gl: RecordingGL,
	canvas: tscon.Canvas,
	row: number,
	cols = canvas.cols
): string {
	const cells = gl.cells;

	if (cells === null) {
		return "";
	}

	let text = "";

	for (let col = 0; col < cols; col++) {
		const { char_code } = tscon.unpackCell(cells[row * canvas.cols + col] ?? 0);
		text += char_code >= 33 ? String.fromCharCode(char_code) : " ";
	}

	return text.replace(/ +$/, "");
}
