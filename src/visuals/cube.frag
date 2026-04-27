#version 300 es

precision mediump float;

in vec3 v_normal;

out vec4 fragColour;

uniform vec3 u_palette[18];

float getClosestPaletteIndex(vec3 colour) {
	float minDistance = 1000.0;
	int closestIndex = 0;

	for (int i = 0; i < 16; i++) {
		float dist = distance(colour, u_palette[i]);
		if (dist < minDistance) {
			minDistance = dist;
			closestIndex = i;
		}
	}

	return float(closestIndex);
}

void main() {
	uint glyph = 35U;
	float bgIndex = getClosestPaletteIndex(v_normal * 0.5 + 0.5);

	fragColour = vec4(
		float(glyph >> 8) / 256.0,
		float(glyph & 255U) / 256.0,
		bgIndex / 256.0,
		0.0
	);
}
