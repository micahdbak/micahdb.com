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

in uint a_bg_colour; // 0..255
in uint a_fg_colour; // 0..255
in uint a_char_code; // 0..65535

uniform int u_rows;
uniform int u_cols;
uniform vec3 u_palette[PALETTE_SIZE];
uniform sampler2D u_program;
uniform int u_program_row, u_program_col, u_program_rows, u_program_cols;

out vec3 v_bg_colour;
out vec3 v_fg_colour;
out vec2 v_uv_coord;
out vec2 v_cell_coord;
flat out uint v_char_code;

vec2 glyphTopLeft(uint char_code) {
	uint i = 0U;

	if (char_code >= ASCII_START && char_code <= ASCII_START + ASCII_GLYPHS * ASCII_STYLES) {
		i = (char_code - ASCII_START) + 1U;
	} else if (char_code >= BOX_START && char_code <= BOX_END) {
		i = (char_code - BOX_START) + ASCII_GLYPHS * ASCII_STYLES + 1U;
	} else {
		return vec2(0.0, 0.0); // empty glyph
	}

	uint x = (i % GLYPH_ATLAS_COLS) * (GLYPH_WIDTH + GLYPH_PADDING);
	uint y = (i / GLYPH_ATLAS_COLS) * (GLYPH_HEIGHT + GLYPH_PADDING);

	return vec2(float(x), float(y));
}

void main() {
	int cell = gl_VertexID / VERTICES_PER_GLYPH;
	int cell_vertex = gl_VertexID % VERTICES_PER_GLYPH;

	// top left row/col for this cell
	int row = cell / u_cols;
	int col = cell % u_cols;

	// top left / bottom right uv coordinates
	vec2 tl = glyphTopLeft(a_char_code);

	if (tl == vec2(0.0, 0.0) &&
		a_bg_colour == 0U &&
		a_fg_colour == 0U &&
		row >= u_program_row &&
		col >= u_program_col &&
		row < u_program_row + u_program_rows &&
		col < u_program_col + u_program_cols) {
		int vrow = row - u_program_row;
		int vcol = col - u_program_col;

		vec2 tex_cell = vec2(float(vcol) / float(u_program_cols), float(vrow) / float(u_program_rows));
		vec4 tex_sample = texture(u_program, tex_cell);

		uint char_code = (uint(round(tex_sample.r * 256.0)) << 8) + uint(round(tex_sample.g * 256.0));
		uint bg = uint(round(tex_sample.b * 256.0));
		uint fg = uint(round(tex_sample.a * 256.0));

		if (bg == 0U && char_code < 32U) {
			fg = 0U;
			char_code = 0x2588U; // █
		}

		v_char_code = char_code;
		v_bg_colour = u_palette[bg];
		v_fg_colour = u_palette[fg];

		tl = glyphTopLeft(v_char_code);
	} else {
		v_char_code = a_char_code;
		v_bg_colour = u_palette[a_bg_colour];
		v_fg_colour = u_palette[a_fg_colour];
	}

	vec2 br = vec2(tl.x + float(GLYPH_WIDTH), tl.y + float(GLYPH_HEIGHT));
	vec2 uv_coord = tl;
	v_cell_coord = vec2(0.0, 0.0);


	// switch properties according to which vertex this is for
	switch (cell_vertex) {
	case 1: // bottom-left
	case 3:
		row++;
		uv_coord = vec2(tl.x, br.y);
		v_cell_coord = vec2(0.0, 1.0);
		break;

	case 2: // top-right
	case 5:
		col++;
		uv_coord = vec2(br.x, tl.y);
		v_cell_coord = vec2(1.0, 0.0);
		break;

	case 4: // bottom-right
		row++;
		col++;
		uv_coord = vec2(br.x, br.y);
		v_cell_coord = vec2(1.0, 1.0);
		break;

	default:
		break;
	}

	// uv coordinates needs to be in [0.0, 1.0]
	uv_coord = vec2(uv_coord.x / float(GLYPH_ATLAS_WIDTH), uv_coord.y / float(GLYPH_ATLAS_HEIGHT));
	v_uv_coord = uv_coord;

	// position needs to be in [-1.0, 1.0]
	float ndc_x = 2.0 * float(col) / float(u_cols) - 1.0;
	float ndc_y = -2.0 * float(row) / float(u_rows) + 1.0;

	gl_Position = vec4(ndc_x, ndc_y, 0.0, 1.0);
}
