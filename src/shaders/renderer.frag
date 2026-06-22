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
	int cell_x = int(gl_FragCoord.x);
	int cell_y = int(gl_FragCoord.y);

	int section_x = min(int(v_cell_coord.x * 5.0), 4); // --2--
	int section_y = min(int(v_cell_coord.y * 9.0), 8); // ----4----

	bool center_x = section_x == 2;
	bool center_y = section_y == 4;

	bool special_block = true;
	bool foreground = false;

	vec3 fg_colour = v_fg_colour;

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
		if (cell_x % 2 == 0 || cell_y % 2 == 0) {
			foreground = true;
		}
		*/
		fg_colour = 0.75 * v_fg_colour + 0.25 * v_bg_colour;
		foreground = true;
		break;

	case GLYPH_50P_FILL:
		/*
		if ((cell_y % 2 == 0 && cell_x % 2 == 1) || (cell_y % 2 == 1 && cell_x % 2 == 0)) {
			foreground = true;
		}
		*/
		fg_colour = 0.50 * v_fg_colour + 0.50 * v_bg_colour;
		foreground = true;
		break;
	
	case GLYPH_25P_FILL:
		/*
		if (cell_x % 2 == 1 && cell_y % 2 == 1) {
			foreground = true;
		}
		*/
		fg_colour = 0.25 * v_fg_colour + 0.75 * v_bg_colour;
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
		if ((center_x && v_cell_coord.y < 0.5) || (center_y && v_cell_coord.x > 0.5) || (center_x && center_y)) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_TRB:
		if (center_x || (center_y && v_cell_coord.x > 0.5)) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_TRBL:
		if (center_x || center_y) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_TRL:
		if (center_y || (center_x && v_cell_coord.y < 0.5)) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_TBL:
		if (center_x || (center_y && v_cell_coord.x < 0.5)) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_TB:
		if (center_x) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_TL:
		if ((center_x && v_cell_coord.y < 0.5) || (center_y && v_cell_coord.x < 0.5) || (center_x && center_y)) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_RB:
		if ((center_x && v_cell_coord.y > 0.5) || (center_y && v_cell_coord.x > 0.5) || (center_x && center_y)) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_RBL:
		if (center_y || (center_x && v_cell_coord.y > 0.5)) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_RL:
		if (center_y) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_BL:
		if ((center_x && v_cell_coord.y > 0.5) || (center_y && v_cell_coord.x < 0.5) || (center_x && center_y)) {
			foreground = true;
		}
		break;

	default:
		// not a special block character; render with glyph atlas
		special_block = false;

		break;
	}

	if (special_block) {
		if (foreground) {
			frag_colour = vec4(fg_colour, 1.0);
		} else {
			frag_colour = vec4(v_bg_colour, 1.0);
		}

		return;
	}

	// render glyph using glyph atlas
	vec4 glyph_sample = texture(u_glyph_atlas, v_uv_coord);
	float fg_mask = clamp(glyph_sample.a, 0.0, 1.0);
	float bg_mask = 1.0 - fg_mask;
	frag_colour = vec4(v_bg_colour * bg_mask, bg_mask) + vec4(fg_colour * fg_mask, fg_mask);
}
