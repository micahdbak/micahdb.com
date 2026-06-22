#version 300 es

#define PALETTE_SIZE 18

#define GLYPH_FULL_BLOCK	0x2588U // █
#define GLYPH_75P_FILL		0x2593U // ▓
#define GLYPH_50P_FILL		0x2592U // ▒
#define GLYPH_25P_FILL		0x2591U // ░

#define GLYPH_TOP_HALF		0x2580U // ▀
#define GLYPH_BOTTOM_HALF	0x2584U // ▄
#define GLYPH_LEFT_HALF		0x258CU // ▌
#define GLYPH_RIGHT_HALF	0x2590U // ▐
#define GLYPH_JUST_TR_QUART	0x259DU // ▝
#define GLYPH_JUST_BR_QUART	0x2597U // ▗
#define GLYPH_JUST_BL_QUART	0x2596U // ▖
#define GLYPH_JUST_TL_QUART	0x2598U // ▘
#define GLYPH_EMPTY_TR_QUART	0x2599U // ▙
#define GLYPH_EMPTY_BR_QUART	0x259BU // ▛
#define GLYPH_EMPTY_BL_QUART	0x259CU // ▜
#define GLYPH_EMPTY_TL_QUART	0x259FU // ▟
#define GLYPH_TR_AND_BL_QUART	0x259EU // ▞
#define GLYPH_TL_AND_BR_QUART	0x259AU // ▚

#define GLYPH_LINE_TR		0x2514U // └
#define GLYPH_LINE_TRB		0x251CU // ├
#define GLYPH_LINE_TRBL		0x253CU // ┼
#define GLYPH_LINE_TRL		0x2534U // ┴
#define GLYPH_LINE_TBL		0x2524U // ┤
#define GLYPH_LINE_TB		0x2502U // │
#define GLYPH_LINE_TL		0x2518U // ┘
#define GLYPH_LINE_RB		0x250CU // ┌
#define GLYPH_LINE_RBL		0x252CU // ┬
#define GLYPH_LINE_RL		0x2500U // ─
#define GLYPH_LINE_BL		0x2510U // ┐

precision mediump float;

in vec3 v_bg_colour;
in vec3 v_fg_colour;
in vec2 v_uv_coord;
in vec2 v_cell_coord;
flat in uint v_char_code;

uniform highp int u_rows;
uniform highp int u_cols;
uniform highp vec3 u_palette[PALETTE_SIZE];
uniform sampler2D u_glyph_atlas;

out vec4 frag_colour;

void main() {
	int cellX = int(gl_FragCoord.x);
	int cellY = int(gl_FragCoord.y);

	int sectionX = min(int(v_cell_coord.x * 5.0), 4); // --2--
	int sectionY = min(int(v_cell_coord.y * 9.0), 8); // ----4----

	bool centerX = sectionX == 2;
	bool centerY = sectionY == 4;

	bool specialBlock = true;
	bool foreground = false;

	vec3 fgColour = v_fg_colour;

	// check for special (fragment rendered) block characters
	switch (v_char_code) {

	// fill characters

	case 0U:
		if (v_bg_colour == u_palette[0] || v_bg_colour == u_palette[16]) {
			discard;
		}
		// foreground = false
		break;

	case GLYPH_FULL_BLOCK:
		foreground = true;
		break;

	case GLYPH_75P_FILL:
		/*
		if (cellX % 2 == 0 || cellY % 2 == 0) {
			foreground = true;
		}
		*/
		fgColour = 0.75 * v_fg_colour + 0.25 * v_bg_colour;
		foreground = true;
		break;

	case GLYPH_50P_FILL:
		/*
		if ((cellY % 2 == 0 && cellX % 2 == 1) || (cellY % 2 == 1 && cellX % 2 == 0)) {
			foreground = true;
		}
		*/
		fgColour = 0.50 * v_fg_colour + 0.50 * v_bg_colour;
		foreground = true;
		break;
	
	case GLYPH_25P_FILL:
		/*
		if (cellX % 2 == 1 && cellY % 2 == 1) {
			foreground = true;
		}
		*/
		fgColour = 0.25 * v_fg_colour + 0.75 * v_bg_colour;
		foreground = true;
		break;

	// block characters

	case GLYPH_TOP_HALF:
		if (v_cell_coord.y < 0.5) {
			foreground = true;
		}
		break;

	case GLYPH_BOTTOM_HALF:
		if (v_cell_coord.y > 0.5) {
			foreground = true;
		}
		break;

	case GLYPH_LEFT_HALF:
		if (v_cell_coord.x < 0.5) {
			foreground = true;
		}
		break;

	case GLYPH_RIGHT_HALF:
		if (v_cell_coord.x > 0.5) {
			foreground = true;
		}
		break;

	case GLYPH_JUST_TR_QUART:
		if (v_cell_coord.x > 0.5 && v_cell_coord.y < 0.5) {
			foreground = true;
		}
		break;

	case GLYPH_JUST_BR_QUART:
		if (v_cell_coord.x > 0.5 && v_cell_coord.y > 0.5) {
			foreground = true;
		}
		break;

	case GLYPH_JUST_BL_QUART:
		if (v_cell_coord.x < 0.5 && v_cell_coord.y > 0.5) {
			foreground = true;
		}
		break;

	case GLYPH_JUST_TL_QUART:
		if (v_cell_coord.x < 0.5 && v_cell_coord.y < 0.5) {
			foreground = true;
		}
		break;

	case GLYPH_EMPTY_TR_QUART:
		if (v_cell_coord.x < 0.5 || v_cell_coord.y > 0.5) {
			foreground = true;
		}
		break;

	case GLYPH_EMPTY_BR_QUART:
		if (v_cell_coord.x < 0.5 || v_cell_coord.y < 0.5) {
			foreground = true;
		}
		break;

	case GLYPH_EMPTY_BL_QUART:
		if (v_cell_coord.x > 0.5 || v_cell_coord.y < 0.5) {
			foreground = true;
		}
		break;

	case GLYPH_EMPTY_TL_QUART:
		if (v_cell_coord.x > 0.5 || v_cell_coord.y > 0.5) {
			foreground = true;
		}
		break;

	case GLYPH_TR_AND_BL_QUART:
		if ((v_cell_coord.x > 0.5 && v_cell_coord.y < 0.5) || (v_cell_coord.x < 0.5 && v_cell_coord.y > 0.5)) {
			foreground = true;
		}
		break;

	case GLYPH_TL_AND_BR_QUART:
		if ((v_cell_coord.x < 0.5 && v_cell_coord.y < 0.5) || (v_cell_coord.x > 0.5 && v_cell_coord.y > 0.5)) {
			foreground = true;
		}
		break;

	// line characters

	case GLYPH_LINE_TR:
		if ((centerX && v_cell_coord.y < 0.5) || (centerY && v_cell_coord.x > 0.5) || (centerX && centerY)) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_TRB:
		if (centerX || (centerY && v_cell_coord.x > 0.5)) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_TRBL:
		if (centerX || centerY) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_TRL:
		if (centerY || (centerX && v_cell_coord.y < 0.5)) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_TBL:
		if (centerX || (centerY && v_cell_coord.x < 0.5)) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_TB:
		if (centerX) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_TL:
		if ((centerX && v_cell_coord.y < 0.5) || (centerY && v_cell_coord.x < 0.5) || (centerX && centerY)) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_RB:
		if ((centerX && v_cell_coord.y > 0.5) || (centerY && v_cell_coord.x > 0.5) || (centerX && centerY)) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_RBL:
		if (centerY || (centerX && v_cell_coord.y > 0.5)) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_RL:
		if (centerY) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_BL:
		if ((centerX && v_cell_coord.y > 0.5) || (centerY && v_cell_coord.x < 0.5) || (centerX && centerY)) {
			foreground = true;
		}
		break;

	default:
		// not a special block character; render with glyph atlas
		specialBlock = false;

		break;
	}

	if (specialBlock) {
		if (foreground) {
			frag_colour = vec4(fgColour, 1.0);
		} else {
			frag_colour = vec4(v_bg_colour, 1.0);
		}

		return;
	}

	// render glyph using glyph atlas
	vec4 glyphSample = texture(u_glyph_atlas, v_uv_coord);
	float fgMask = clamp(glyphSample.a, 0.0, 1.0);
	float bgMask = 1.0 - fgMask;
	frag_colour = vec4(v_bg_colour * bgMask, bgMask) + vec4(fgColour * fgMask, fgMask);
}
