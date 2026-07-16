import { Canvas } from "./canvas.ts";
import { Terminal } from "./terminal.ts";
import { Renderer } from "./renderer.ts";
import { Scroller } from "./scroller.ts";

import { NebulaeVisuals } from "./visuals/nebulae.ts";
//import { CubeVisuals } from "./visuals/cube.ts";
//import { EarthVisuals } from "./visuals/earth.ts";

import { Link } from "./components/link.ts";

import { renderCp437 } from "./cp437.ts";
import { textGlyphs, TexGlyphMode, textureGlyphs } from "./glyphs.ts";

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

const LINKS = [
	"mailto:micah_baker@sfu.ca",
	"https://github.com/micahdbak",
	"https://linkedin.com/in/micahdbak",
	"https://micahdb.com/resume.pdf"
];

const CARD = `\
█▐▌▀ ▄ ▄ ▐   ▐▀▄ ▄ ▌▄ ▄  ▄  \\f3  ▄ ▄     ▄\\F7
▌▌▌▌█  ▄█▐▀▄ ▐▀▄ ▄▌█ ▐▄▀▐ ▀ \\f3 ≡\\f0\\b3■.■\\f3\\b0≡▄▄▄▀ \\F7
▌ ▌▌▀▄▐▄█▐ █ ▐▄▀▐▄▌▌█▐▄▄▐   \\f3   ▄▀█▀▀▀▄ \\F7

\\F3I am a\\f7:\t\t\\F7Software Developer
\\F3Based in\\f7:\tVancouver, BC, Canada
\\F3Currently\\f7:\tStudying
\\F3Previously\\f7:\tOpen WebUI, Improving, Brave
\\F3Education\\f7:\tBSc Computing Science at SFU

\\F3E-mail\\f7:\t\t\\a${LINKS[0]}
\\F3GitHub\\f7:\t\t\\a${LINKS[1]}
\\F3LinkedIn\\f7:\t\\a${LINKS[2]}
\\F3Résumé / CV\\f7:\t\\a${LINKS[3]}

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
╚════════════════════════════════════╝

\t\\f7Great. Regardless, welcome to my site.
This is an example of some sort of paragraph.
\\F7micahdb.com\\f7 will contain all sorts of info about
me.
`;

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
		// initialize

		const canvas = new Canvas(canvas_el);
		const terminal = new Terminal(canvas);
		const renderer = new Renderer(canvas);

		// visuals

		const visuals = new NebulaeVisuals(canvas);
		void visuals.init();

		let visuals_glyphs = textureGlyphs(canvas.rows, canvas.cols, TexGlyphMode.GLYPHS);

		// scroller

		const scroller = new Scroller(terminal);

		// card/content

		const links: Link[] = [];

		for (let i = 0; i < LINKS.length; i++) {
			links.push(new Link(terminal, LINKS[i], LINKS[i]));
		}

		const card = textGlyphs(CARD, 52, false);

		// main draw loop

		let resized = false;

		canvas.addEventListener("resize", () => {
			resized = true;
		});

		const draw = () => {
			if (resized) {
				resized = false;
				visuals.resize(canvas.rows, canvas.cols);
				visuals_glyphs = textureGlyphs(canvas.rows, canvas.cols, TexGlyphMode.GLYPHS);
			}

			canvas.clear();

			visuals.render();
			renderer.draw(visuals_glyphs, visuals.texture, {
				row: 0,
				col: 0,
				rows: visuals_glyphs.rows,
				cols: visuals_glyphs.cols
			});

			terminal.clear();
			scroller.update(80);

			const card_row = 1 - scroller.row;
			const card_col = 2;

			terminal.blit(
				card,
				{ row: 0, col: 0, rows: card.rows, cols: card.cols },
				{ row: card_row, col: card_col, rows: card.rows, cols: card.cols }
			);

			for (let i = 0; i < LINKS.length; i++) {
				const link_row = card_row + card.anchors[i].row;
				const link_col = card_col + card.anchors[i].col;

				links[i].update(link_row, link_col);
				terminal.blit(
					links[i].glyphs,
					{ row: 0, col: 0, rows: 1, cols: links[i].glyphs.cols },
					{ row: link_row, col: link_col, rows: 1, cols: links[i].glyphs.cols }
				);
			}

			const status_row = canvas.rows - 1 - (terminal.detail_text.length > 0 ? 1 : 0);
			terminal.blit(
				scroller.status_glyphs,
				{ row: 0, col: 0, rows: 1, cols: scroller.status_glyphs.cols },
				{ row: status_row, col: 0, rows: 1, cols: scroller.status_glyphs.cols }
			);

			terminal.draw();

			canvas.mouse_click = false;

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
