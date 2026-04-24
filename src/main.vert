#version 300 es

precision mediump float;

#define GLYPH_WIDTH		96U
#define GLYPH_HEIGHT		211U
#define GLYPH_PADDING		8U
#define GLYPH_ATLAS_WIDTH	4096U
#define GLYPH_ATLAS_HEIGHT	4096U
#define GLYPH_ATLAS_COLS	(GLYPH_ATLAS_WIDTH / (GLYPH_WIDTH + GLYPH_PADDING))
#define VERTICES_PER_GLYPH	6
#define PALETTE_SIZE		18

in uint a_bgColour; // 0..255
in uint a_fgColour; // 0..255
in uint a_charCode; // 0..65535

uniform int u_rows;
uniform int u_cols;
uniform vec3 u_palette[PALETTE_SIZE];

out vec3 v_bgColour;
out vec3 v_fgColour;
out vec2 v_uvCoord;
flat out uint v_charCode;

vec2 glyphTopLeft(uint charCode) {
	uint i = 0U;

	if (charCode >= 33U && charCode <= 126U) {
		i = charCode - 33U + 1U;
	} else if (charCode >= 0x2500U && charCode <= 0x259FU) {
		i = charCode - 0x2500U + 95U;
	} else {
		return vec2(0.0, 0.0); // empty glyph
	}

	uint x = (i % GLYPH_ATLAS_COLS) * (GLYPH_WIDTH + GLYPH_PADDING);
	uint y = (i / GLYPH_ATLAS_COLS) * (GLYPH_HEIGHT + GLYPH_PADDING);

	return vec2(float(x), float(y));
}

void main() {
	int cell = gl_VertexID / VERTICES_PER_GLYPH;
	int cellVertex = gl_VertexID % VERTICES_PER_GLYPH;

	// top left row/col for this cell
	int row = cell / u_cols;
	int col = cell % u_cols;

	// top left / bottom right uv coordinates
	vec2 tl = glyphTopLeft(a_charCode);
	vec2 br = vec2(tl.x + float(GLYPH_WIDTH), tl.y + float(GLYPH_HEIGHT));
	vec2 uvCoord = tl;

	// switch properties according to which vertex this is for
	switch (cellVertex) {
	case 1:
	case 3:
		row++;
		uvCoord = vec2(tl.x, br.y);
		break;
	case 2:
	case 5:
		col++;
		uvCoord = vec2(br.x, tl.y);
		break;
	case 4:
		row++;
		col++;
		uvCoord = vec2(br.x, br.y);
		break;
	default:
		break;
	}

	// uv coordinates needs to be in [0.0, 1.0]
	uvCoord = vec2(uvCoord.x / float(GLYPH_ATLAS_WIDTH), uvCoord.y / float(GLYPH_ATLAS_HEIGHT));

	// position needs to be in [-1.0, 1.0]
	float ndcX = 2.0 * float(col) / float(u_cols) - 1.0;
	float ndcY = -2.0 * float(row) / float(u_rows) + 1.0;

	v_bgColour = u_palette[a_bgColour];
	v_fgColour = u_palette[a_fgColour];
	v_uvCoord = uvCoord;
	v_charCode = a_charCode;

	gl_Position = vec4(ndcX, ndcY, 0.0, 1.0);
}
