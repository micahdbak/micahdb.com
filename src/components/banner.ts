export const BANNER_ROW = 1;
export const BANNER_ROWS = 3;

export function makeBanner(file: string, title: string, cols: number) {
	const slack = cols - file.length * 2 - title.length;

	if (slack < 0) {
		return file;
	}

	const lpad = " ".repeat(Math.floor(slack / 2));
	const rpad = " ".repeat(Math.ceil(slack / 2));

	return file + lpad + title + rpad + file;
}
