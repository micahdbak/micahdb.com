import { ScrollBar } from "./scroll_bar.ts";
import { Glyph, Terminal } from "../terminal.ts";

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
	private scrollBar: ScrollBar;
	private root: Folder;

	constructor(terminal: Terminal, root: Folder) {
		this.terminal = terminal;
		this.scrollBar = new ScrollBar(terminal);
		this.root = root;
		this.rowOffset = 0;
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
		fg1Colour: number,
		fg2Colour: number,
		bgColour: number,
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

		let height = this.treeHeight();
		let surplusRows = Math.max(height - rowCount, 0);
		let rowOffset = 0;

		if (surplusRows > 0) {
			rowOffset = Math.floor(this.scrollBar.frac * (surplusRows + 1));
		}

		let row = startRow;
		let off = 0;

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

			// don't draw anything until the offset
			if (off < rowOffset) {
				off++;
				continue;
			}

			let branch = "";

			for (let i = 0; i < depth - 1; i++) {
				branch += indices[i] >= folders[i].children.length ? "    " : "│   ";
			}

			branch += i >= folder.children.length - 1 ? "└── " : "├── ";
			branch = branch.slice(0, colCount);

			this.terminal.drawText(branch, row, col, bgColour, 8);

			let fg = isFolder ? fg2Colour : fg1Colour;
			let bg = bgColour;

			if (
				this.terminal.mouseAt(row, col + branch.length, 1, file.name.length)
			) {
				bg = 11;
				fg = 8;

				if (this.terminal.mouseClick) {
					if (isFolder) {
						file.open = !file.open;
						height = this.treeHeight();
						surplusRows = Math.max(height - rowCount, 0);

						if (surplusRows > 0) {
							this.scrollBar.setFrac(rowOffset / (surplusRows + 1));
						} else {
							this.scrollBar.setFrac(0);
						}
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

		// TODO: gesture scrolling
		// this.scrollBar.draw(startRow, startCol + colCount - 3, rowCount);
	}
}

export { FileClickFunction, File, Folder, FileTree };
