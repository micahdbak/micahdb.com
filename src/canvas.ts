export class Canvas extends EventTarget {
	// cell size in px at 100% zoom and DPR 1
	static readonly CELL_WIDTH = 8;
	static readonly CELL_HEIGHT = 16;

	public element: HTMLCanvasElement;
	public gl: WebGL2RenderingContext;

	// actual width/height in device pixels
	public height: number;
	public width: number;

	public rows: number;
	public cols: number;

	public actual_cell_height: number;
	public actual_cell_width: number;

	// to be set by a component which "claims" the mouse
	public mouse_owner: string;

	public mouse_row: number;
	public mouse_col: number;

	public mouse_down: boolean;
	public mouse_click: boolean;
	public mouse_down_row: number;
	public mouse_down_col: number;

	constructor(element: HTMLCanvasElement) {
		super();
		this.element = element;

		const gl = element.getContext("webgl2");

		if (!gl) {
			window.location.href = "/readme.html";
			return;
		}

		this.gl = gl;

		this.mouse_owner = "";

		this.mouse_down = false;
		this.mouse_click = false;

		this.resize();

		// add event listeners

		window.addEventListener("resize", () => {
			this.resize();
		});

		window.addEventListener("pointermove", (e: PointerEvent) => {
			this.mouseMove(e.clientX, e.clientY);
		});

		this.element.addEventListener("pointerdown", (e: PointerEvent) => {
			this.mouseMove(e.clientX, e.clientY);

			this.mouse_down = true;
			this.mouse_down_row = this.mouse_row;
			this.mouse_down_col = this.mouse_col;

			(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		});

		this.element.addEventListener("pointerup", () => {
			this.mouse_down = false;
			this.mouse_click = true;
		});

		this.element.addEventListener("pointercancel", () => {
			this.mouse_down = false;
		});

		this.element.addEventListener("pointerleave", () => {
			this.mouse_down = false;
		});
	}

	private resize() {
		const dpr = window.devicePixelRatio || 1;

		this.height = this.element.clientHeight * dpr;
		this.width = this.element.clientWidth * dpr;
		this.element.height = this.height;
		this.element.width = this.width;

		this.actual_cell_height = Math.max(
			Canvas.CELL_HEIGHT / 2,
			Canvas.CELL_HEIGHT * dpr
		);
		this.actual_cell_width = Math.max(
			Canvas.CELL_WIDTH / 2,
			Canvas.CELL_WIDTH * dpr
		);

		const rows = Math.round(Math.max(1, this.height / this.actual_cell_height));
		const cols = Math.round(Math.max(1, this.width / this.actual_cell_width));

		// reset mouse related fields
		this.mouse_owner = "";

		this.mouse_row = undefined;
		this.mouse_col = undefined;

		this.mouse_down = false;
		this.mouse_click = false;
		this.mouse_down_row = undefined;
		this.mouse_down_col = undefined;

		if (rows !== this.rows || cols !== this.cols) {
			this.rows = rows;
			this.cols = cols;

			this.dispatchEvent(new Event("resize"));
		}
	}

	private mouseMove(client_x: number, client_y: number) {
		const dpr = window.devicePixelRatio || 1;

		const actual_client_y = client_y * dpr;
		const actual_client_x = client_x * dpr;

		this.mouse_row = Math.floor(actual_client_y / this.actual_cell_height);
		this.mouse_col = Math.floor(actual_client_x / this.actual_cell_width);
	}

	mouseAt(row: number, col: number, rows: number, cols: number): boolean {
		return (
			this.mouse_row >= row &&
			this.mouse_row < row + rows &&
			this.mouse_col >= col &&
			this.mouse_col < col + cols
		);
	}

	mouseDownAt(row: number, col: number, rows: number, cols: number): boolean {
		return (
			this.mouse_down_row >= row &&
			this.mouse_down_row < row + rows &&
			this.mouse_down_col >= col &&
			this.mouse_down_col < col + cols
		);
	}
}
