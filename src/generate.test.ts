import { describe, expect, test } from "bun:test";
import * as tscon from "@micahdb/tscon";

import { textToHtml } from "./generate.ts";

const LINK_CLASS = `f${tscon.Colour.BRIGHT_CYAN} b${tscon.Colour.BG}`;

describe("textToHtml links", () => {
	test("an explicit href wraps only its display text", () => {
		const html = textToHtml(
			"\\a0{https://example.com}Docs Page\\a1",
			80,
			tscon.Wrap.WORD
		);

		expect(html).toBe(
			`<a href="https://example.com" class="${LINK_CLASS}">Docs Page</a>`
		);
	});

	test("a bare anchor uses its display text as the href", () => {
		const html = textToHtml("\\a0https://example.com\\a1", 80, tscon.Wrap.WORD);

		expect(html).toBe(
			`<a href="https://example.com" class="${LINK_CLASS}">https://example.com</a>`
		);
	});

	test("display text is HTML-escaped", () => {
		const html = textToHtml("\\a0{/path}<tag>\\a1", 80, tscon.Wrap.WORD);

		expect(html).toBe(`<a href="/path" class="${LINK_CLASS}">&lt;tag&gt;</a>`);
	});

	test("a wrapped link closes and reopens on each row", () => {
		const html = textToHtml(
			"\\a0{/path}this is a very long link that wraps\\a1",
			20,
			tscon.Wrap.WORD
		);
		const text = html.replace(/<[^>]*>/g, "").split("\n").join(" ");

		expect(html.match(/<a /g)).toHaveLength(2);
		expect(html.match(/<\/a>/g)).toHaveLength(2);
		expect(text).toBe("this is a very long link that wraps");
	});
});
