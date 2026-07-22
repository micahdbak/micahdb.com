export function makeBanner(file: string, title: string, cols: number) {
	const slack = cols - file.length * 2 - title.length;

	if (slack < 0) {
		return file;
	}

	const lpad = "\\f0" + " ".repeat(Math.floor(slack / 2)) + "\\F7";
	const rpad = "\\f0" + " ".repeat(Math.ceil(slack / 2)) + "\\F7";

	return file + lpad + title + rpad + file;
}
