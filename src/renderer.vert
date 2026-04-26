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
uniform sampler2D u_offScreen;

out vec3 v_bgColour;
out vec3 v_fgColour;
out vec2 v_uvCoord;
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

/*
uint[3] sampleOffScreen(int row, int col) {
	// top and bottom half of the cell UV coordinates
	vec2 th = vec2(float(col) / float(u_cols), float(row) / float(u_rows));
	vec2 bh = vec2(float(col) / float(u_cols), float(2 * row + 1) / float(2 * u_rows));
	vec4 thColour = texture(u_offScreen, th);
	vec4 bhColour = texture(u_offScreen, bh);
	float thBrightness = dot(thColour.rgb, vec3(0.299, 0.587, 0.114));
	float bhBrightness = dot(bhColour.rgb, vec3(0.299, 0.587, 0.114));

	// colours: 16U < 0U < 8U < 7U < 17U
	uint colours[6] = uint[6](16U, 0U, 8U, 7U, 17U, 17U);
	int thColourIndex = int(thBrightness * 5.0);
	int bhColourIndex = int(bhBrightness * 5.0);

	// if colour difference is big enough, use "▄"
	if (abs(thColourIndex - bhColourIndex) > 1) {
		return uint[3](9604U, colours[thColourIndex], colours[bhColourIndex]);
	}

	float brightness = max(thBrightness, bhBrightness);
	int colourIndex = max(thColourIndex, bhColourIndex);

	uint bgColour = colours[colourIndex - 1 < 0 ? 0 : colourIndex - 1];
	uint fgColour = colours[colourIndex];

	// " -=#░@▒▓"
	uint glyphs[9] = uint[9](0U, 45U, 61U, 35U, 9617U, 64U, 9618U, 9619U, 9619U);
	int colourLevel = int(brightness * 5.0 * 8.0) % 8;
	uint glyph = glyphs[colourLevel];

	return uint[3](glyph, bgColour, fgColour);
}
*/

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
		vec4 texSample = texture(u_offScreen, texCell);

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
	v_uvCoord = uvCoord;

	// position needs to be in [-1.0, 1.0]
	float ndcX = 2.0 * float(col) / float(u_cols) - 1.0;
	float ndcY = -2.0 * float(row) / float(u_rows) + 1.0;

	gl_Position = vec4(ndcX, ndcY, 0.0, 1.0);
}
