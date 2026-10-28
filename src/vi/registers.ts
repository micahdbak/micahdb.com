export type RegisterContent = { text: string; linewise: boolean };

/**
 * The vi register file: the unnamed register, the yank register "0, the
 * numbered delete chain "1-"9, and the named registers "a-"z.
 */
export class Registers {
	private zero: RegisterContent | null = null;
	private numbered: RegisterContent[] = [];
	private named = new Map<string, RegisterContent>();
	unnamed: RegisterContent | null = null;

	/**
	 * Deletes fill the unnamed register, the named register if given, and
	 * shift the numbered chain "1-"9
	 */
	record(content: RegisterContent, register?: string): void {
		this.unnamed = content;

		if (register !== undefined) {
			this.recordNamed(content, register);
			return;
		}

		if (content.linewise) {
			this.numbered.unshift(content);
			this.numbered.length = Math.min(this.numbered.length, 9);
		}
	}

	/**
	 * Yanks fill the unnamed register and "0; the numbered chain is for
	 * deletes only
	 */
	recordYank(content: RegisterContent, register?: string): void {
		this.unnamed = content;

		if (register !== undefined) {
			this.recordNamed(content, register);
			return;
		}

		this.zero = content;
	}

	read(register?: string): RegisterContent | null {
		if (register === undefined) {
			return this.unnamed;
		}

		if (register === "0") {
			return this.zero;
		}

		if (/^[1-9]$/.test(register)) {
			return this.numbered[Number(register) - 1] ?? null;
		}

		return this.named.get(register.toLowerCase()) ?? null;
	}

	// uppercase register letters append to their lowercase counterpart
	private recordNamed(content: RegisterContent, register: string): void {
		const key = register.toLowerCase();
		const existing = this.named.get(key);

		if (register === register.toUpperCase() && existing !== undefined) {
			const separator = content.linewise || existing.linewise ? "\n" : "";

			this.named.set(key, {
				text: existing.text + separator + content.text,
				linewise: content.linewise,
			});
			return;
		}

		this.named.set(key, content);
	}
}
