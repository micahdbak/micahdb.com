#version 300 es

precision mediump float;

in vec3 v_fg_colour;
in vec3 v_bg_colour;
flat in ivec2 v_glyph_coord;
in vec2 v_cell_coord;

uniform mediump usampler2D u_bitmap_font;

out vec4 frag_colour;

void main() {
	// pixel coordinate within the glyph
	int x = clamp(int(v_cell_coord.x * 8.0), 0, 7);
	int y = clamp(int(v_cell_coord.y * 16.0), 0, 15);

	ivec2 texel_coord = ivec2(v_glyph_coord.x, v_glyph_coord.y + y / 4);
	uvec4 texel_sample = texelFetch(u_bitmap_font, texel_coord, 0);

	// 1 byte
	uint glyph_row = texel_sample[y % 4];

	int bit_pos = 7 - x;
	int on = int(glyph_row >> bit_pos & 1u);
	int off = on ^ 1;

	vec3 colour = float(on) * v_fg_colour + float(off) * v_bg_colour;
	frag_colour = vec4(colour, 1.0);
}
