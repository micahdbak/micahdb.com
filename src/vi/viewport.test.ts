import { describe, expect, test } from "bun:test";

import { Viewport } from "./viewport.ts";

describe("viewport", () => {
	test("follow brings an offscreen cursor into view", () => {
		const viewport = new Viewport();

		viewport.follow(20, 100, 10);

		expect(viewport.top).toBe(12);
	});

	test("a panned view is not pulled back to a stationary cursor", () => {
		const viewport = new Viewport();

		viewport.follow(20, 100, 10);
		viewport.scrollTo(30, 100, 10);
		viewport.follow(20, 100, 10);

		expect(viewport.top).toBe(30);
	});

	test("holdCursor keeps a panned view where it is", () => {
		const viewport = new Viewport();

		viewport.scrollTo(30, 100, 10);
		viewport.holdCursor(20);
		viewport.follow(20, 100, 10);

		expect(viewport.top).toBe(30);
	});

	test("resetFollow follows the cursor again after a reflow", () => {
		const viewport = new Viewport();

		viewport.follow(20, 100, 10);
		viewport.scrollTo(30, 100, 10);
		viewport.resetFollow();
		viewport.follow(20, 100, 10);

		expect(viewport.top).toBe(20);
	});

	test("scrollTo clamps to the document", () => {
		const viewport = new Viewport();

		viewport.scrollTo(-5, 100, 10);
		expect(viewport.top).toBe(0);

		viewport.scrollTo(1000, 100, 10);
		expect(viewport.top).toBe(92);
	});
});
