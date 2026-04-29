#version 300 es

#define NUM_DIMENSIONS	7U

precision mediump float;

in vec3 v_normal;
in vec2 v_uvCoord;

uniform sampler2D u_cubeTexture;
//uniform float u_cols;
//uniform float u_rows;

out vec4 fragColour;

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
	float minDist = 1000.0;
	uint dim = 0U;

	for (uint i = 0U; i < NUM_DIMENSIONS; i++) {
		float dist = distance(colour, dimensions[i]);

		if (dist < minDist) {
			minDist = dist;
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
	vec3 colour = texture(u_cubeTexture, v_uvCoord).rgb;
	vec3 normal = normalize(v_normal);
	vec3 light = normalize(vec3(0.0, -0.25, 1.0));

	uint dim = getDimension(colour);
	float lam = max(dot(normal, light), 0.0);
	float lum = lam * getLuminance(colour, dim) * 0.8;

	uint colours[3] = uint[3](16U, dim, dim + 8U);

	// white needs a special selection
	if (dim == 0U) {
		colours = uint[3](16U, 8U, 17U);
	}

	int bgColourIdx = min(int(lum * 3.0), 3);
	int fgColourIdx = min(int(lum * 3.0) + 1, 3);
	uint bgColour = colours[bgColourIdx];
	uint fgColour = colours[fgColourIdx];

	// " -=#░@▒▓"
	uint glyphs[8] = uint[8](0U, 45U, 61U, 35U, 9617U, 64U, 9618U, 9619U);
	int glyphIdx = int(lum * 3.0 * 8.0) % 8;
	uint glyph = glyphs[glyphIdx];

	fragColour = vec4(
		float(glyph >> 8) / 256.0,
		float(glyph & 255U) / 256.0,
		float(bgColour) / 256.0,
		float(fgColour) / 256.0
	);
}


