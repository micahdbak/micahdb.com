import { Glyph } from "../glyph.ts";
import { Terminal } from "../terminal.ts";
import { Colour } from "../colour.ts";

type FileClickFunction = (file: File) => void;

class File {
	public name: string;
	public content: string;
	public onclick: FileClickFunction;

	constructor(name: string, content: string, onclick: FileClickFunction = () => {}) {
		this.name = name;
		this.content = content;
		this.onclick = onclick;
	}
}

class Folder extends File {
	public children: File[];
	public open: boolean;

	constructor(name: string, children: File[]) {
		super(name, "");
		this.children = children;
		this.open = false;
	}
}

class FileTree {
	private terminal: Terminal;
	private root: Folder;

	constructor(terminal: Terminal, root: Folder) {
		this.terminal = terminal;
		this.root = root;
	}

	treeHeight() {
		let height = 0;
		const folders = [this.root];
		const indices = [0];

		while (folders.length > 0) {
			const folder = folders.at(folders.length - 1) as Folder;
			const i = indices.at(folders.length - 1) as number;

			if (i >= folder.children.length) {
				folders.pop();
				indices.pop();
				continue;
			}

			const file = folder.children[i];
			indices[indices.length - 1] = i + 1;

			if (file instanceof Folder && file.open) {
				folders.push(file);
				indices.push(0);
			}

			height++;
		}

		return Math.max(height, 1);
	}

	draw(
		fg1: Colour,
		fg2: Colour,
		bg_col: Colour,
		start_row: number,
		start_col: number,
		rows: number,
		cols: number
	) {
		if (cols < 2 || rows < 2) {
			return;
		}

		const col = start_col;
		const folders = [this.root];
		const indices = [0];

		let row = start_row;

		while (folders.length > 0 && row - start_row < rows) {
			const folder = folders.at(folders.length - 1) as Folder;
			const i = indices.at(folders.length - 1) as number;
			const depth = indices.length;

			if (i >= folder.children.length) {
				folders.pop();
				indices.pop();
				continue;
			}

			const file = folder.children[i];
			const is_folder = file instanceof Folder;
			indices[indices.length - 1] = i + 1;

			if (is_folder && file.open) {
				folders.push(file);
				indices.push(0);
			}

			let branch = "";

			for (let i = 0; i < depth - 1; i++) {
				branch += indices[i] >= folders[i].children.length ? "    " : "│   ";
			}

			branch += i >= folder.children.length - 1 ? "└── " : "├── ";
			branch = branch.slice(0, cols);

			this.terminal.drawText(branch, row, col, Colour.LIGHT_BLACK, bg_col);

			let fg = is_folder ? fg2 : fg1;
			let bg = bg_col;

			if (this.terminal.canvas.mouseAt(row, col + branch.length, 1, file.name.length)) {
				bg = Colour.LIGHT_GREEN;
				fg = Colour.LIGHT_BLACK;

				if (this.terminal.canvas.mouse_click) {
					if (is_folder) {
						file.open = !file.open;
					} else {
						file.onclick();
					}
				}
			}

			const name = file.name.slice(0, cols - branch.length);

			if (name.length > 0) {
				this.terminal.drawText(
					name,
					row,
					col + branch.length,
					fg,
					bg,
					is_folder ? Glyph.BOLD_FONT : Glyph.NORMAL_FONT
				);
			}

			row++;
		}
	}
}

export { FileClickFunction, File, Folder, FileTree };
