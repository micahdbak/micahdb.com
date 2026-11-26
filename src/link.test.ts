import { describe, expect, test } from "bun:test";
import * as tscon from "@micahdb/tscon";

import { Link } from "./link.ts";

function parse(source: string, cols = 80): Link[] {
	const glyphs = new tscon.Glyphs(source, cols, { wrap: tscon.Wrap.HARD });

	return Link.parse(glyphs);
}

describe("Link.parse", () => {
	test("an explicit href links the text to its terminator", () => {
		const source = "pre \\a0{https://example.com}Docs Page\\a1 post";
		const glyphs = new tscon.Glyphs(source, 80);
		const [link] = Link.parse(glyphs);

		expect(link).toBeDefined();
		expect(link!.url).toBe("https://example.com");
		expect(source.slice(link!.start, link!.end)).toBe("Docs Page");
	});

	test("a bare href uses its display text as the URL", () => {
		const source = "\\a0https://example.com\\a1";
		const glyphs = new tscon.Glyphs(source, 80);
		const [link] = Link.parse(glyphs);

		expect(link!.url).toBe("https://example.com");
		expect(source.slice(link!.start, link!.end)).toBe("https://example.com");
	});

	test("a wrapped display range spans multiple rows", () => {
		const source = "pre \\a0{https://example.com}Very Long Link Text\\a1 post";
		const glyphs = new tscon.Glyphs(source, 20, { wrap: tscon.Wrap.HARD });
		const [link] = Link.parse(glyphs);
		const spans = [...glyphs.spansFor(link!.start, link!.end)];

		expect(spans.length).toBeGreaterThan(1);
		expect(spans[0]!.row).toBe(0);
		expect(spans[spans.length - 1]!.row).toBe(1);
	});

	test("adjacent links keep their own ranges", () => {
		const source = "\\a0{/a}first\\a1\\a0{/b}second\\a1";
		const glyphs = new tscon.Glyphs(source, 80);
		const links = Link.parse(glyphs);

		expect(links.map((link) => link.url)).toEqual(["/a", "/b"]);

		for (const link of links) {
			expect(source.slice(link.start, link.end)).not.toBe("");
		}
	});

	test("a pipe stays part of an explicit URL", () => {
		const [link] = parse("\\a0{https://example.com?a|b}text\\a1");

		expect(link!.url).toBe("https://example.com?a|b");
	});

	test("unmatched anchors and empty displays produce no links", () => {
		for (const source of [
			"\\a0{/missing}text",
			"orphan \\a1",
			"\\a0{/empty}\\a1",
			"plain text",
		]) {
			expect(parse(source)).toEqual([]);
		}
	});

	test("a nested opener replaces the unfinished link", () => {
		const source = "\\a0{/first}first\\a0{/second}second\\a1";
		const glyphs = new tscon.Glyphs(source, 80);
		const links = Link.parse(glyphs);

		expect(links).toHaveLength(1);
		expect(links[0]!.url).toBe("/second");
		expect(source.slice(links[0]!.start, links[0]!.end)).toBe("second");
	});
});
