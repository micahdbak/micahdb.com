import { Glyph } from "../glyph.ts";
import { Terminal } from "../terminal.ts";
import { Colour } from "../colour.ts";

type FileClickFunction = (file: File) => void;

class File {
	public name: string;
	public content: string;
	public onclick: FileClickFunction;

	constructor(
		name: string,
		content: string,
		onclick: FileClickFunction = () => {}
	) {
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
		let rowsDisplayed = 0;
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

			rowsDisplayed++;
		}

		return Math.max(rowsDisplayed, 1);
	}

	draw(
		fg1Colour: Colour,
		fg2Colour: Colour,
		bgColour: Colour,
		startRow: number,
		startCol: number,
		rowCount: number,
		colCount: number
	) {
		if (colCount < 2 || rowCount < 2) {
			return;
		}

		const col = startCol;
		const folders = [this.root];
		const indices = [0];

		let row = startRow;

		while (folders.length > 0 && row - startRow < rowCount) {
			const folder = folders.at(folders.length - 1) as Folder;
			const i = indices.at(folders.length - 1) as number;
			const depth = indices.length;

			if (i >= folder.children.length) {
				folders.pop();
				indices.pop();
				continue;
			}

			const file = folder.children[i];
			const isFolder = file instanceof Folder;
			indices[indices.length - 1] = i + 1;

			if (isFolder && file.open) {
				folders.push(file);
				indices.push(0);
			}

			let branch = "";

			for (let i = 0; i < depth - 1; i++) {
				branch += indices[i] >= folders[i].children.length ? "    " : "│   ";
			}

			branch += i >= folder.children.length - 1 ? "└── " : "├── ";
			branch = branch.slice(0, colCount);

			this.terminal.drawText(branch, row, col, Colour.LIGHT_BLACK, bgColour);

			let fg = isFolder ? fg2Colour : fg1Colour;
			let bg = bgColour;

			if (
				this.terminal.canvas.mouseAt(
					row,
					col + branch.length,
					1,
					file.name.length
				)
			) {
				bg = Colour.LIGHT_GREEN;
				fg = Colour.LIGHT_BLACK;

				if (this.terminal.canvas.mouse_click) {
					if (isFolder) {
						file.open = !file.open;
					} else {
						file.onclick();
					}
				}
			}

			const name = file.name.slice(0, colCount - branch.length);

			if (name.length > 0) {
				this.terminal.drawText(
					name,
					row,
					col + branch.length,
					fg,
					bg,
					isFolder ? Glyph.BOLD_FONT : Glyph.NORMAL_FONT
				);
			}

			row++;
		}
	}
}

export { FileClickFunction, File, Folder, FileTree };
