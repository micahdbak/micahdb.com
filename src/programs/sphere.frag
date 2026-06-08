#version 300 es

#define NUM_DIMENSIONS	7U

precision mediump float;

in mat3 v_TBN;
in vec3 v_position;
in vec2 v_uvCoord;

out vec4 fragColour;

uniform sampler2D u_globeTexture;

const vec3 dimensions[NUM_DIMENSIONS] = vec3[NUM_DIMENSIONS](
	vec3(1.0, 1.0, 1.0),	// white
	vec3(1.0, 0.0, 0.0),	// red
	vec3(0.0, 1.0, 0.0),	// green
	vec3(1.0, 1.0, 0.0),	// yellow
	vec3(0.0, 0.0, 1.0),	// blue
	vec3(1.0, 0.0, 1.0),	// purple
	vec3(0.0, 1.0, 1.0)	// cyan
);

uint getDimension(vec3 colour) {
	colour = normalize(colour);
	float minDist = 1000.0;
	uint dim = 0U;

	for (uint i = 0U; i < NUM_DIMENSIONS; i++) {
		float dist = distance(colour, normalize(dimensions[i]));

		if (dist < minDist) {
			minDist = dist;
			dim = i;
		}
	}

	return dim;
}

float getLuminance(vec3 colour, uint dim) {
	// colour is NOT normalized
	vec3 dimCol = dimensions[dim];
	return dot(colour, dimCol) / dot(dimCol, dimCol);
}

void main() {
	vec3 normal = vec3(0.0, 0.0, 1.0);
	normal = normalize(v_TBN * normal);

	vec3 light = vec3(-4.0, -2.0, 4.0); // fixed position
	light = normalize(light - v_position);

	vec3 colour = texture(u_globeTexture, v_uvCoord).rgb;
	uint dim = getDimension(colour);
	float lam = max(dot(normal, light), 0.2);
	float lum = min(lam * getLuminance(colour, dim), 1.0);

	// dithering
	float bayer[16] = float[](
		0.0, 0.5, 0.125, 0.625,
		0.75, 0.25, 0.875, 0.375,
		0.1875, 0.6875, 0.0625, 0.5625,
		0.9375, 0.4375, 0.8125, 0.3125
	);
	float ditherOffset = (bayer[int(gl_FragCoord.y) % 4 * 4 + int(gl_FragCoord.x) % 4] - 0.5) / 12.0;
	lum += ditherOffset;

	uint fgColours[3] = uint[3](8U, dim, dim + 8U);
	// uint bgColours[3] = uint[3](16U, 16U, 0U);

	// white needs a special selection
	if (dim == 0U) {
		fgColours = uint[3](8U, 17U, 17U);
	}

	// int bgColourIdx = min(int(lum * 3.0), 3);
	int fgColourIdx = clamp(int(lum * 3.0), 0, 2);

	uint bgColour = 16U; // bgColours[bgColourIdx];
	uint fgColour = fgColours[fgColourIdx];

	//                             .    -    ,    :    ;    =    !    *    #    $    @
	uint glyphs[12] = uint[12](0U, 46U, 45U, 44U, 58U, 59U, 61U, 33U, 42U, 35U, 36U, 64U);
	int glyphIdx = clamp(int(lum * 12.0), 0, 11);
	uint glyph = glyphs[glyphIdx];

	fragColour = vec4(
		float(glyph >> 8) / 256.0,
		float(glyph & 255U) / 256.0,
		float(bgColour) / 256.0,
		float(fgColour) / 256.0
	);
}
