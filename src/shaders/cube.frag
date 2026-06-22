#version 300 es

#define NUM_DIMENSIONS	7U

precision mediump float;

in mat3 v_TBN;
in vec3 v_position;
in vec2 v_uv_coord;

uniform sampler2D u_cube_texture;
uniform sampler2D u_cube_normal;

out vec4 frag_colour;

const vec3 dimensions[NUM_DIMENSIONS] = vec3[NUM_DIMENSIONS](
	normalize(vec3(1.0, 1.0, 1.0)),	// white
	vec3(1.0, 0.0, 0.0),		// red
	vec3(0.0, 1.0, 0.0),		// green
	normalize(vec3(1.0, 1.0, 0.0)),	// yellow
	vec3(0.0, 0.0, 1.0),		// blue
	normalize(vec3(1.0, 0.0, 1.0)),	// purple
	normalize(vec3(0.0, 1.0, 1.0))	// cyan
);

uint getDimension(vec3 colour) {
	colour = normalize(colour);
	float min_dist = 1000.0;
	uint dim = 0U;

	for (uint i = 0U; i < NUM_DIMENSIONS; i++) {
		float dist = distance(colour, dimensions[i]);

		if (dist < min_dist) {
			min_dist = dist;
			dim = i;
		}
	}

	return dim;
}

float getLuminance(vec3 colour, uint dim) {
	// colour is NOT normalized
	return dot(colour, dimensions[dim]);
}

void main() {
	vec3 normal_col = texture(u_cube_normal, v_uv_coord).rgb;
	vec3 normal = normal_col * 2.0 - 1.0;
	normal = normalize(v_TBN * normal);

	vec3 light = vec3(1.0, -1.0, 1.0); // fixed position
	light = normalize(light - v_position);

	vec3 colour = texture(u_cube_texture, v_uv_coord).rgb;
	uint dim = getDimension(colour);
	float lam = max(dot(normal, light), 0.0);
	float lum = lam * getLuminance(colour, dim) * 0.8;

	uint colours[3] = uint[3](16U, dim, dim + 8U);

	// white needs a special selection
	if (dim == 0U) {
		colours = uint[3](16U, 8U, 17U);
	}

	int bg_idx = min(int(lum * 3.0), 3);
	int fg_idx = min(int(lum * 3.0) + 1, 3);
	uint bg = colours[bg_idx];
	uint fg = colours[fg_idx];

	// " -=#░@▒▓"
	uint glyphs[8] = uint[8](0U, 45U, 61U, 35U, 9617U, 64U, 9618U, 9619U);
	int glyph_idx = int(lum * 3.0 * 8.0) % 8;
	uint glyph = glyphs[glyph_idx];

	frag_colour = vec4(
		float(glyph >> 8) / 256.0,
		float(glyph & 255U) / 256.0,
		float(bg) / 256.0,
		float(fg) / 256.0
	);
}
