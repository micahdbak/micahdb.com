import { Canvas } from "./canvas.ts";
import { Terminal } from "./terminal.ts";
import { CP437_CHARS, renderCp437 } from "./cp437.ts";
import { textToGlyphs } from "./glyphs.ts";

/*
 *	Character set (code page 437):
 *
 *	  ☺ ☻ ♥ ♦ ♣ ♠ • ◘ ○ ◙ ♂ ♀ ♪ ♫ ☼ ► ◄ ↕ ‼ ¶ § ▬ ↨ ↑ ↓ → ← ∟ ↔ ▲ ▼
 *
 *	  ! " # $ % & ' ( ) * + , - . / 0 1 2 3 4 5 6 7 8 9 : ; < = > ?
 *
 *	@ A B C D E F G H I J K L M N O P Q R S T U V W X Y Z [ \ ] ^ _
 *
 *	` a b c d e f g h i j k l m n o p q r s t u v w x y z { | } ~ ⌂
 *
 *	Ç ü é â ä à å ç ê ë è ï î ì Ä Å É æ Æ ô ö ò û ù ÿ Ö Ü ¢ £ ¥ ₧ ƒ
 *
 *	á í ó ú ñ Ñ ª º ¿ ⌐ ¬ ½ ¼ ¡ « » ░ ▒ ▓ │ ┤ ╡ ╢ ╖ ╕ ╣ ║ ╗ ╝ ╜ ╛ ┐
 *
 *	└ ┴ ┬ ├ ─ ┼ ╞ ╟ ╚ ╔ ╩ ╦ ╠ ═ ╬ ╧ ╨ ╤ ╥ ╙ ╘ ╒ ╓ ╫ ╪ ┘ ┌ █ ▄ ▌ ▐ ▀
 *
 *	α ß Γ π Σ σ µ τ Φ Θ Ω δ ∞ φ ε ∩ ≡ ± ≥ ≤ ⌠ ⌡ ÷ ≈ ° ∙ · √ ⁿ ² ■
 */

const CARD = `\
█▐▌▀ ▄ ▄ ▐   ▐▀▄ ▄ ▌▄ ▄  ▄  \\f2 ▄▄▄▄▄   ▄  \\F7
▌▌▌▌█  ▄█▐▀▄ ▐▀▄ ▄▌█ ▐▄▀▐ ▀ \\f2 ≡\\f0\\b2^.^\\f2\\b0≡▄▄ ▄▀ \\F7
▌ ▌▌▀▄▐▄█▐ █ ▐▄▀▐▄▌▌█▐▄▄▐   \\f2   ▄▀████   \\F7

\\F3I am a\\f7:\t\tSoftware Developer
\\F3Based in\\f7:\tVancouver, BC, Canada
\\F3Currently\\f7:\tStudying
\\F3Previously\\f7:\tOpen WebUI, Improving, Brave
\\F3Education\\f7:\tBSc Computing Science at SFU

\\F3E-mail\\f7:\t\t\\F5<micah_baker@sfu.ca>
\\F3GitHub\\f7:\t\t\\F5https://github.com/micahdbak
\\F3LinkedIn\\f7:\t\\F5https://linkedin.com/in/micahdbak
\\F3Résumé / CV\\f7:\t\\F5https://micahdb.com/resume.pdf
\\F7
\\b0   \\b1   \\b2   \\b3   \\b4   \\b5   \\b6   \\b7   \\b7
\\B0   \\B1   \\B2   \\B3   \\B4   \\B5   \\B6   \\B7   `;

// cp437.html
async function render() {
	const canvas = document.getElementById("2d") as HTMLCanvasElement;
	const font = "160px 'JetBrains Mono'";
	await renderCp437(canvas, font);
}

// index.html
function main() {
	const canvas_el = document.getElementById("webgl") as HTMLCanvasElement;

	try {
		const canvas = new Canvas(canvas_el);
		const terminal = new Terminal(canvas);

		const cp437 = textToGlyphs(CP437_CHARS, 32, true);

		const card = textToGlyphs(CARD, 52, false);

		const draw = () => {
			terminal.blit(
				cp437,
				{ row: 0, col: 0, rows: cp437.rows, cols: cp437.cols },
				{ row: 1, col: 2, rows: cp437.rows, cols: cp437.cols }
			);

			terminal.blit(
				card,
				{ row: 0, col: 0, rows: card.rows, cols: card.cols },
				{ row: 1, col: cp437.cols + 4, rows: card.rows, cols: card.cols }
			);

			terminal.draw();

			requestAnimationFrame(draw);
		};

		requestAnimationFrame(draw);
	} catch (err: Error) {
		console.error(err);
	}
}

if (window.location.pathname === "/cp437.html") {
	await render();
} else {
	main();
}
