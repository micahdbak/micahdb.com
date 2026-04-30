#version 300 es

#define GLYPH_WIDTH		96U
#define GLYPH_HEIGHT		211U
#define GLYPH_PADDING		8U
#define GLYPH_ATLAS_WIDTH	4096U
#define GLYPH_ATLAS_HEIGHT	4096U
#define GLYPH_ATLAS_COLS	(GLYPH_ATLAS_WIDTH / (GLYPH_WIDTH + GLYPH_PADDING))

#define ASCII_START		33U
#define ASCII_END		126U
#define ASCII_GLYPHS		(ASCII_END - ASCII_START + 1U)
#define ASCII_STYLES		4U
#define BOX_START		0x2500U
#define BOX_END			0x259FU

#define VERTICES_PER_GLYPH	6
#define PALETTE_SIZE		18

in uint a_bgColour; // 0..255
in uint a_fgColour; // 0..255
in uint a_charCode; // 0..65535

uniform int u_rows;
uniform int u_cols;
uniform vec3 u_palette[PALETTE_SIZE];
uniform sampler2D u_visuals;

out vec3 v_bgColour;
out vec3 v_fgColour;
out vec2 v_uvCoord;
out vec2 v_cellCoord;
flat out uint v_charCode;

vec2 glyphTopLeft(uint charCode) {
	uint i = 0U;

	if (charCode >= ASCII_START && charCode <= ASCII_START + ASCII_GLYPHS * ASCII_STYLES) {
		i = (charCode - ASCII_START) + 1U;
	} else if (charCode >= BOX_START && charCode <= BOX_END) {
		i = (charCode - BOX_START) + ASCII_GLYPHS * ASCII_STYLES + 1U;
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

	if (tl == vec2(0.0, 0.0) && a_bgColour == 0U) {
		vec2 texCell = vec2(float(col) / float(u_cols), float(row) / float(u_rows));
		vec4 texSample = texture(u_visuals, texCell);

		v_charCode = (uint(round(texSample.r * 256.0)) << 8) + uint(round(texSample.g * 256.0));
		v_bgColour = u_palette[int(round(texSample.b * 256.0))];
		v_fgColour = u_palette[int(round(texSample.a * 256.0))];

		tl = glyphTopLeft(v_charCode);
	} else {
		v_charCode = a_charCode;
		v_bgColour = u_palette[a_bgColour];
		v_fgColour = u_palette[a_fgColour];
	}

	vec2 br = vec2(tl.x + float(GLYPH_WIDTH), tl.y + float(GLYPH_HEIGHT));
	vec2 uvCoord = tl;
	v_cellCoord = vec2(0.0, 0.0);


	// switch properties according to which vertex this is for
	switch (cellVertex) {
	case 1: // bottom-left
	case 3:
		row++;
		uvCoord = vec2(tl.x, br.y);
		v_cellCoord = vec2(0.0, 1.0);
		break;

	case 2: // top-right
	case 5:
		col++;
		uvCoord = vec2(br.x, tl.y);
		v_cellCoord = vec2(1.0, 0.0);
		break;

	case 4: // bottom-right
		row++;
		col++;
		uvCoord = vec2(br.x, br.y);
		v_cellCoord = vec2(1.0, 1.0);
		break;

	default:
		break;
	}

	// uv coordinates needs to be in [0.0, 1.0]
	uvCoord = vec2(uvCoord.x / float(GLYPH_ATLAS_WIDTH), uvCoord.y / float(GLYPH_ATLAS_HEIGHT));
	v_uvCoord = uvCoord;

	// position needs to be in [-1.0, 1.0]
	float ndcX = 2.0 * float(col) / float(u_cols) - 1.0;
	float ndcY = -2.0 * float(row) / float(u_rows) + 1.0;

	gl_Position = vec4(ndcX, ndcY, 0.0, 1.0);
}
