import { Canvas } from "./canvas.ts";
import { Terminal } from "./terminal.ts";
import { Renderer } from "./renderer.ts";
import { renderCp437 } from "./cp437.ts";
import { textGlyphs, TexGlyphMode, textureGlyphs } from "./glyphs.ts";
import { loadTexture } from "./textures.ts";

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
█▐▌▀ ▄ ▄ ▐   ▐▀▄ ▄ ▌▄ ▄  ▄  \\f2  ▄ ▄     ▄\\F7
▌▌▌▌█  ▄█▐▀▄ ▐▀▄ ▄▌█ ▐▄▀▐ ▀ \\f2 ≡\\f0\\b2■.■\\f2\\b0≡▄▄▄▀ \\F7
▌ ▌▌▀▄▐▄█▐ █ ▐▄▀▐▄▌▌█▐▄▄▐   \\f2   ▄▀█▀▀▀▄ \\F7

\\F3I am a\\f7:\t\t\\F7Software Developer
\\F3Based in\\f7:\tVancouver, BC, Canada
\\F3Currently\\f7:\tStudying
\\F3Previously\\f7:\tOpen WebUI, Improving, Brave
\\F3Education\\f7:\tBSc Computing Science at SFU

\\F3E-mail\\f7:\t\t\\F5<micah_baker@sfu.ca>
\\F3GitHub\\f7:\t\t\\F5https://github.com/micahdbak
\\F3LinkedIn\\f7:\t\\F5https://linkedin.com/in/micahdbak
\\F3Résumé / CV\\f7:\t\\F5https://micahdb.com/resume.pdf

\\F7\\b0   \\b1   \\b2   \\b3   \\b4   \\b5   \\b6   \\b7   \\B0
   \\B1   \\B2   \\B3   \\B4   \\B5   \\B6   \\B7\\f0   \\f7\\b0

╔═══════════ \\F7Code Page 437\\f7 ══════════╗
║                                    ║
║  \\F7 ☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼\\f7  ║
║  \\F7 !"#$%&'()*+,-./0123456789:;<=>?\\f7  ║
║  \\F7@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\\f7  ║
║  \\F7\`abcdefghijklmnopqrstuvwxyz{|}~⌂\\f7  ║
║  \\F7ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒ\\f7  ║
║  \\F7áíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐\\f7  ║
║  \\F7└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀\\f7  ║
║  \\F7αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ \\f7  ║
║                                    ║
╚════════════════════════════════════╝`;

// cp437.html
async function render() {
	const canvas = document.getElementById("2d") as HTMLCanvasElement;
	const font = "160px 'JetBrains Mono'";
	await renderCp437(canvas, font);
}

// index.html
async function main() {
	const canvas_el = document.getElementById("webgl") as HTMLCanvasElement;

	try {
		const canvas = new Canvas(canvas_el);

		const tex = await loadTexture(canvas.gl, "dog.jpg");

		const terminal = new Terminal(canvas);
		const renderer = new Renderer(canvas);

		const card = textGlyphs(CARD, 52, false);
		const cols = Math.min(canvas.cols, 2 * canvas.rows);
		let dog = textureGlyphs(canvas.rows, cols, TexGlyphMode.GLYPHS);

		let resized = false;

		canvas.addEventListener("resize", () => {
			resized = true;
		});

		const draw = () => {
			if (resized) {
				// can handle resize here
				resized = false;

				const cols = Math.min(canvas.cols, 2 * canvas.rows);
				dog = textureGlyphs(canvas.rows, cols, TexGlyphMode.GLYPHS);
			}

			terminal.clear();

			const col = canvas.cols - dog.cols;
			renderer.draw(dog, tex, { row: 0, col, rows: dog.rows, cols: dog.cols });

			terminal.blit(
				card,
				{ row: 0, col: 0, rows: card.rows, cols: card.cols },
				{ row: 1, col: 2, rows: card.rows, cols: card.cols }
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
	await main();
}
