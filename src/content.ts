import INDEX_MD from "./content/index.md" with { type: "text" };
import EDUCATION_MD from "./content/education.md" with { type: "text" };
import EXPERIENCE_MD from "./content/experience.md" with { type: "text" };
import PROJECTS_MD from "./content/projects.md" with { type: "text" };
import BLOG_MD from "./content/blog.md" with { type: "text" };

export const INDEX_URL = "#";
export const EDUCATION_URL = "#education";
export const EXPERIENCE_URL = "#experience";
export const PROJECTS_URL = "#projects";
export const BLOG_URL = "#blog";

// prettier-ignore
const _files: string[][] = [
	[INDEX_URL, INDEX_MD],
	[EDUCATION_URL, EDUCATION_MD],
	[EXPERIENCE_URL, EXPERIENCE_MD],
	[PROJECTS_URL, PROJECTS_MD],
	[BLOG_URL, BLOG_MD]
] as string[][];

export const CONTENT: Record<string, string> = {};

export function loadContent() {
	for (let i = 0; i < _files.length; i++) {
		const url = _files[i][0];
		const md = _files[i][1];
		CONTENT[url] = md;
	}
}
