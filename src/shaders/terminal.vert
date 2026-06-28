#version 300 es

in uint a_colour;
in uint a_char_code;

uniform int u_rows;
uniform int u_cols;
uniform int u_mouse_row;
uniform int u_mouse_col;
uniform vec3 u_palette[16];

out vec3 v_fg_colour;
out vec3 v_bg_colour;
flat out ivec2 v_glyph_coord;
out vec2 v_cell_coord;

void main() {
	int row = gl_InstanceID / u_cols;
	int col = gl_InstanceID % u_cols;

	int fg_idx = int(a_colour >> 4 & 0xfu);
	int bg_idx = int(a_colour & 0xfu);

	if (u_mouse_row == row && u_mouse_col == col) {
		int tmp = fg_idx;
		fg_idx = bg_idx;
		bg_idx = tmp;

		// default to white bg, black fg
		if (fg_idx == bg_idx) {
			bg_idx = 15;
			fg_idx = 0;
		}
	}

	v_fg_colour = u_palette[fg_idx];
	v_bg_colour = u_palette[bg_idx];

	// 32 glyph columns
	int glyph_row = int(a_char_code / 32u);
	int glyph_col = int(a_char_code % 32u);

	// coordinate of a_char_code in u_bitmap_font
	v_glyph_coord = ivec2(glyph_col, glyph_row * 4);

	/* A glyph is made up of two triangles, six vertices:
	 *
	 *   0--2     ,5     0--2,5
	 *   | /  +  / |  =  |   |
	 *   1'     3--4    1,3--4
	 */

	// gl_VertexID == 0
	v_cell_coord = vec2(0.0, 0.0);

	switch (gl_VertexID) {
	case 1:
	case 3:
		row++;
		v_cell_coord = vec2(0.0, 1.0);

		break;

	case 2:
	case 5:
		col++;
		v_cell_coord = vec2(1.0, 0.0);

		break;

	case 4:
		row++;
		col++;
		v_cell_coord = vec2(1.0, 1.0);

		break;

	default:
		break;
	}

	// position needs to be in [-1.0, 1.0]
	float ndc_x = 2.0 * float(col) / float(u_cols) - 1.0;
	float ndc_y = -2.0 * float(row) / float(u_rows) + 1.0;

	gl_Position = vec4(ndc_x, ndc_y, 0.0, 1.0);
}
