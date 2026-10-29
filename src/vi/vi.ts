import * as tscon from "@micahdb/tscon";

import { Editor } from "./editor/editor.ts";
import { Input } from "./input.ts";
import type { ImageAnchor, ImageLimits } from "./layout.ts";
import { View } from "./view.ts";
import { Viewport } from "./viewport.ts";

type TextureLoader = (gl: WebGL2RenderingContext) => WebGLTexture | Promise<WebGLTexture>;

export type TextureSource = WebGLTexture | TextureLoader;

export type ViOptions = {
	/** The page's Canvas: constructed by the page so scene passes and
	 *  visuals can share it with `Vi`. */
	canvas: tscon.Canvas;
	content: string;
	filename: string;
	textures?: Record<string, TextureSource>;
	/** Per-region sampling mode, keyed by anchor name. Regions absent
	 *  here sample photographically (`TexGlyphMode.SAMPLE`). */
	image_modes?: Record<string, tscon.TexGlyphMode>;
	/** Largest region an image anchor may claim. Defaults to 40 rows by
	 *  80 columns; the document's payload is clamped to this. */
	image_limits?: ImageLimits;
	font_path?: string;
	pad_cols?: number;
	/** Called once per frame before the view renders, for scene passes
	 *  that feed registry textures (e.g. rendering a 3D model into its
	 *  render target). */
	before_frame?: () => void;
};

/**
 * Wires the editor core, input, and view layers together and owns the
 * frame loop. Pages provide the content, the texture registry, and
 * options; everything below the canvas is this class's business.
 */
export class Vi {
	private readonly canvas: tscon.Canvas;
	private readonly terminal: tscon.Terminal;
	private readonly renderer: tscon.Renderer;

	private readonly editor: Editor;
	private readonly viewport = new Viewport();
	private readonly input: Input;
	private readonly view: View;
	private readonly textures = new Map<string, WebGLTexture>();
	private readonly image_modes: Record<string, tscon.TexGlyphMode>;

	private readonly pad_cols: number;
	private readonly before_frame: (() => void) | null;

	private font: WebGLTexture | null = null;
	private resized = true;

	constructor(options: ViOptions) {
		this.canvas = options.canvas;
		this.terminal = new tscon.Terminal(this.canvas);
		this.renderer = new tscon.Renderer(this.canvas);

		this.pad_cols = options.pad_cols ?? 2;
		this.image_modes = options.image_modes ?? {};
		this.before_frame = options.before_frame ?? null;
		this.editor = new Editor(options.content, this.wrapWidth(), options.image_limits);
		this.input = new Input(this.editor, this.canvas, (row, col) =>
			this.editor.layout.screenToBuffer(this.viewport.top + row, col - this.pad_cols)
		);
		this.input.attach();

		this.view = new View(this.terminal, this.renderer, {
			editor: this.editor,
			layout: this.editor.layout,
			viewport: this.viewport,
			textures: this.textures,
			image_modes: this.image_modes,
			pad_cols: this.pad_cols,
			filename: options.filename,
		});

		this.canvas.addEventListener("resize", () => {
			this.resized = true;
		});

		this.loadTextures(options.textures ?? {});
		this.loadFont(options.font_path);

		this.frame();
	}

	/**
	 * The image regions the document currently asks for, in the order it
	 * declares them. Sizes are clamped by {@link ViOptions.image_limits}, so
	 * the document can resize a texture but not beyond the limit.
	 */
	imageRegions(): ImageAnchor[] {
		return this.editor.layout.images();
	}

	private wrapWidth(): number {
		return Math.max(8, this.canvas.cols - this.pad_cols * 2);
	}

	private loadTextures(registry: Record<string, TextureSource>): void {
		for (const [name, source] of Object.entries(registry)) {
			if (source instanceof WebGLTexture) {
				this.textures.set(name, source);
				continue;
			}

			void Promise.resolve()
				.then(() => source(this.canvas.gl))
				.then((texture) => this.textures.set(name, texture))
				.catch(() => undefined);
		}
	}

	private loadFont(path: string | undefined): void {
		if (path === undefined) {
			return;
		}

		void tscon.loadTexture(this.canvas.gl, path)
			.then((texture) => {
				this.font = texture;
			})
			.catch(() => undefined);
	}

	private frame = (): void => {
		const canvas = this.canvas;

		// too small to lay out a usable screen
		if (canvas.rows < 8 || canvas.cols < 16) {
			canvas.clear();
			this.terminal.clear();
			this.terminal.draw();
			canvas.mouse_click = false;
			requestAnimationFrame(this.frame);
			return;
		}

		if (this.resized) {
			this.resized = false;
			this.editor.layout.setWidth(this.wrapWidth());
		}

		if (this.font !== null && canvas.user_font === null) {
			canvas.user_font = this.font;
			this.terminal.use_user_font = true;
			this.renderer.use_user_font = true;
		}

		if (this.before_frame !== null) {
			this.before_frame();
		}

		/**
		 * The editor core sees the viewport as a plain struct it can read
		 * for H M L and paging; the Viewport instance owns the real state
		 */
		this.editor.viewport.top = this.viewport.top;
		this.editor.viewport.rows = Math.max(1, canvas.rows - 2);

		this.input.update();

		this.viewport.update(this.editor.layout.displayRows.length, canvas.rows);

		const cursor_screen = this.editor.layout.bufferToScreen(this.editor.cursor.pos);
		const first = this.editor.layout.firstRowOfLine[this.editor.cursor.pos.line] ?? 0;
		const cursor_display_row = first + cursor_screen.row;
		this.viewport.follow(cursor_display_row, this.editor.layout.displayRows.length, canvas.rows);

		this.editor.viewport.top = this.viewport.top;

		canvas.clear();
		this.terminal.clear();
		this.view.render();

		/**
		 * After the render, so links saw the click before the cursor
		 * landed and flipped their line to its raw form
		 */
		this.input.placeClick();

		canvas.mouse_click = false;

		if (canvas.class_name !== document.body.className) {
			document.body.className = canvas.class_name;
		}

		requestAnimationFrame(this.frame);
	};
}
