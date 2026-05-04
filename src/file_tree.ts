import { Glyph, Terminal } from "./terminal.ts";

type FileClickedFunction = (file: File) => void;

class File {
	public name: string;
	public content: string;
	public onclick: FileClickedFunction;

	constructor(
		name: string,
		content: string,
		onclick: FileClickedFunction = () => {}
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
	private rowOffset: number;

	constructor(terminal: Terminal, root: Folder) {
		this.terminal = terminal;
		this.root = root;
		this.rowOffset = 0;
	}

	draw(startRow: number, startCol: number, rowCount: number, colCount: number) {
		const col = startCol;
		const folders = [this.root];
		const indices = [0];

		let row = startRow;

		while (folders.length > 0 && row - startRow < this.rowOffset + rowCount) {
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

			// don't draw anything until the offset
			if (row - startRow < this.rowOffset) {
				continue;
			}

			let branch = "";

			for (let i = 0; i < depth - 1; i++) {
				branch += indices[i] >= folders[i].children.length ? "    " : "│   ";
			}

			branch += i >= folder.children.length - 1 ? "└── " : "├── ";
			branch = branch.slice(0, colCount);

			this.terminal.drawText(
				branch,
				row,
				col,
				0,
				8,
				0,
				0,
				false,
				Glyph.NORMAL_FONT
			);

			let fg = isFolder ? 12 : 15;
			let bg = 0;

			if (this.terminal.mouseAt(row, col + branch.length, file.name.length)) {
				bg = 11;
				fg = 8;

				if (this.terminal.mouseClick) {
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
					bg,
					fg,
					0,
					0,
					false,
					isFolder ? Glyph.BOLD_FONT : Glyph.NORMAL_FONT
				);
			}

			row++;
		}
	}
}

export { FileClickedFunction, File, Folder, FileTree };
