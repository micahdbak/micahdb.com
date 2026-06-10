#version 300 es

#define NUM_DIMENSIONS	8U

precision mediump float;

in mat3 v_TBN;
in vec3 v_position;
in vec2 v_uvCoord;
in vec3 v_light;

uniform sampler2D u_sphereTexture;
uniform sampler2D u_sphereNormal;

out vec4 fragColour;

// NOTE: these are in order of the colours in src/index.ts
const vec3 dimensions[NUM_DIMENSIONS] = vec3[NUM_DIMENSIONS](
	vec3(0.0, 0.0, 0.0),	// black (unused)
	vec3(1.0, 0.8, 0.8),	// red
	vec3(1.0, 1.0, 0.8),	// yellow
	vec3(0.8, 1.0, 0.8),	// green
	vec3(0.8, 1.0, 1.0),	// cyan
	vec3(0.8, 0.8, 1.0),	// blue
	vec3(1.0, 0.8, 1.0),	// purple
	vec3(1.0, 1.0, 1.0)	// white
);

uint getDim(vec3 col) {
	col = normalize(col);
	float dist = 1000.0;
	uint dim = 0U;

	for (uint i = 1U; i < NUM_DIMENSIONS; i++) {
		float d = distance(col, normalize(dimensions[i]));

		if (d < dist) {
			dist = d;
			dim = i;
		}
	}

	return dim;
}

float getLum(vec3 col, uint dim) {
	vec3 dcol = dimensions[dim];
	return dot(col, dcol) / dot(dcol, dcol);
}

void main() {
	vec3 normal = texture(u_sphereNormal, v_uvCoord).rgb;
	normal = normal * 2.0 - 1.0;
	normal = normalize(v_TBN * normal);

	vec3 light = normalize(v_light);
	float lam = dot(normal, light);

	vec3 col = texture(u_sphereTexture, v_uvCoord).rgb;

	uint dim = getDim(col);
	float lum = lam * getLum(col, dim);

	// dithering
	float bayer[16] = float[](
		0.0, 0.5, 0.125, 0.625,
		0.75, 0.25, 0.875, 0.375,
		0.1875, 0.6875, 0.0625, 0.5625,
		0.9375, 0.4375, 0.8125, 0.3125
	);
	float dither = (bayer[int(gl_FragCoord.y) % 4 * 4 + int(gl_FragCoord.x) % 4] - 0.5) / 12.0;
	lum = clamp(lum + dither, 0.05, 1.0);
	int layer = clamp(int(lum * 3.0), 0, 2);

	//                           '.'  '-'  ','  ':'  ';'  '='  '!'  '*'  '#'  '$'  '@'
	uint glyphs[12] = uint[](0U, 46U, 45U, 44U, 58U, 59U, 61U, 33U, 42U, 35U, 36U, 64U);
	uint bgs[3] = uint[](16U, dim, dim + 8U);
	uint fgs[3] = uint[](dim, dim + 8U, 17U);

	if (dim == 7U) {
		if (layer > 0) {
			// reverse the order of the glyphs
			glyphs = uint[](64U, 36U, 35U, 42U, 33U, 61U, 59U, 58U, 44U, 45U, 46U, 0U);
		}

		bgs = uint[](16U, 7U, 17U);
		fgs = uint[](7U, 16U, 8U);
	}

	int glyphi = clamp(int(12.0 * (3.0 * lum - float(layer))), 0, 11);
	uint glyph = glyphs[glyphi];
	uint bg = bgs[layer];
	uint fg = fgs[layer];

	fragColour = vec4(
		float(glyph >> 8) / 256.0,
		float(glyph & 255U) / 256.0,
		float(bg) / 256.0,
		float(fg) / 256.0
	);
}
