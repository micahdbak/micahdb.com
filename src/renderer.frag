#version 300 es

#define PALETTE_SIZE 18

#define GLYPH_FULL_BLOCK	0x2588U
#define GLYPH_75P_FILL		0x2593U
#define GLYPH_50P_FILL		0x2592U
#define GLYPH_25P_FILL		0x2591U

#define GLYPH_TOP_HALF		0x2580U
#define GLYPH_BOTTOM_HALF	0x2584U
#define GLYPH_LEFT_HALF		0x258CU
#define GLYPH_RIGHT_HALF	0x2590U

#define GLYPH_LINE_TR		0x2514U
#define GLYPH_LINE_TRB		0x251CU
#define GLYPH_LINE_TB		0x2502U
#define GLYPH_LINE_TL		0x2518U
#define GLYPH_LINE_RB		0x250CU
#define GLYPH_LINE_RL		0x2500U
#define GLYPH_LINE_BL		0x2510U

precision mediump float;

in vec3 v_bgColour;
in vec3 v_fgColour;
in vec2 v_uvCoord;
in vec2 v_cellCoord;
flat in uint v_charCode;

uniform highp int u_rows;
uniform highp int u_cols;
uniform highp vec3 u_palette[PALETTE_SIZE];
uniform sampler2D u_glyphAtlas;

out vec4 fragColour;

void main() {
	int cellX = int(gl_FragCoord.x);
	int cellY = int(gl_FragCoord.y);

	int sectionX = min(int(v_cellCoord.x * 5.0), 4); // --2--
	int sectionY = min(int(v_cellCoord.y * 9.0), 8); // ----4----

	bool centerX = sectionX == 2;
	bool centerY = sectionY == 4;

	bool specialBlock = true;
	bool foreground = false;

	// check for special (fragment rendered) block characters
	switch (v_charCode) {

	// fill characters

	case 0U:
		if (v_bgColour == u_palette[0] || v_bgColour == u_palette[16]) {
			discard;
		}
		// foreground = false
		break;

	case GLYPH_FULL_BLOCK:
		foreground = true;
		break;

	case GLYPH_75P_FILL:
		if (cellX % 2 == 0 || cellY % 2 == 0) {
			foreground = true;
		}
		break;

	case GLYPH_50P_FILL:
		if ((cellY % 2 == 0 && cellX % 2 == 1) || (cellY % 2 == 1 && cellX % 2 == 0)) {
			foreground = true;
		}
		break;
	
	case GLYPH_25P_FILL:
		if (cellX % 2 == 1 && cellY % 2 == 1) {
			foreground = true;
		}
		break;

	// block characters

	case GLYPH_TOP_HALF:
		if (v_cellCoord.y < 0.5) {
			foreground = true;
		}
		break;

	case GLYPH_BOTTOM_HALF:
		if (v_cellCoord.y > 0.5) {
			foreground = true;
		}
		break;

	case GLYPH_LEFT_HALF:
		if (v_cellCoord.x < 0.5) {
			foreground = true;
		}
		break;

	case GLYPH_RIGHT_HALF:
		if (v_cellCoord.x > 0.5) {
			foreground = true;
		}
		break;

	// line characters

	case GLYPH_LINE_TR:
		if ((centerX && v_cellCoord.y < 0.5) || (centerY && v_cellCoord.x > 0.5) || (centerX && centerY)) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_TRB:
		if (centerX || (centerY && v_cellCoord.x > 0.5)) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_TB:
		if (centerX) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_TL:
		if ((centerX && v_cellCoord.y < 0.5) || (centerY && v_cellCoord.x < 0.5) || (centerX && centerY)) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_RB:
		if ((centerX && v_cellCoord.y > 0.5) || (centerY && v_cellCoord.x > 0.5) || (centerX && centerY)) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_RL:
		if (centerY) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_BL:
		if ((centerX && v_cellCoord.y > 0.5) || (centerY && v_cellCoord.x < 0.5) || (centerX && centerY)) {
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
			fragColour = vec4(v_fgColour, 1.0);
		} else {
			fragColour = vec4(v_bgColour, 1.0);
		}

		return;
	}

	// render glyph using glyph atlas
	vec4 glyphSample = texture(u_glyphAtlas, v_uvCoord);
	float fgMask = clamp(glyphSample.a, 0.0, 1.0);
	float bgMask = 1.0 - fgMask;
	fragColour = vec4(v_bgColour * bgMask, bgMask) + vec4(v_fgColour * fgMask, fgMask);
}
