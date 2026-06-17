import { Glob } from "bun";
import { join } from "node:path";

export async function loadContent(): Promise<Record<string, string>> {
	const glob = new Glob("**/*.md"); // all markdown files
	const scan_path = "./src/content";
	const paths = await Array.fromAsync(
		glob.scan({ cwd: scan_path, onlyFiles: true })
	);

	const content: Record<string, string> = {};

	const promises = paths.map(async (rel_path) => {
		const path = join(scan_path, rel_path);
		const match = rel_path.match(/([^/]+)\.[^.]+$/);

		if (!match) {
			throw new Error(`Cannot match filename for path ${path}`);
		}

		const url = "#" + match[1];
		const md = await Bun.file(path).text();

		content[url] = md;
	});

	await Promise.all(promises);

	const index = content["#index"];
	delete content["#index"];
	content["#"] = index;

	return content;
}
