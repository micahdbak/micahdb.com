#version 300 es

#define SAMPLE_MODE 0u

precision mediump float;

in vec2 v_cell_coord; // f_mode == 1
in vec2 v_uv_coord;

flat in uint f_mode;
flat in int f_is_cursor;
flat in vec3 f_fg_colour; // f_mode == 1
flat in vec3 f_bg_colour; // f_mode == 1
flat in ivec2 f_glyph_coord; // f_mode == 1

uniform mediump usampler2D u_bitmap_font; // f_mode == 1
uniform sampler2D u_texture;

out vec4 frag_colour;

void main() {
	if (f_mode == SAMPLE_MODE) {
		frag_colour = texture(u_texture, v_uv_coord);

		// invert the sample
		if (f_is_cursor == 1) {
			frag_colour = vec4(vec3(1.0, 1.0, 1.0) - frag_colour.rgb, 1.0);
		}

		return;
	}

	vec3 fg = f_fg_colour;
	vec3 bg = f_bg_colour;

	if (f_is_cursor == 1) {
		vec3 tmp = fg;
		fg = bg;
		bg = tmp;
	}

	// pixel coordinate within the glyph
	int x = clamp(int(v_cell_coord.x * 8.0), 0, 7);
	int y = clamp(int(v_cell_coord.y * 16.0), 0, 15);

	ivec2 texel_coord = ivec2(f_glyph_coord.x, f_glyph_coord.y + y / 4);
	uvec4 texel_sample = texelFetch(u_bitmap_font, texel_coord, 0);

	// 1 byte
	uint glyph_row = texel_sample[y % 4];

	int bit_pos = 7 - x;
	int on = int(glyph_row >> bit_pos & 1u);
	int off = on ^ 1;

	vec3 colour = float(on) * fg + float(off) * bg;
	frag_colour = vec4(colour, 1.0);
}
