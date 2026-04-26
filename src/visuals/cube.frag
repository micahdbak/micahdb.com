#version 300 es

precision mediump float;

in vec3 v_colour;

out vec4 fragColour;

uniform vec3 u_palette[18];

float getClosestPaletteIndex(vec3 color) {
	float minDistance = 1000.0;
	int closestIndex = 0;

	for (int i = 0; i < 16; i++) {
		float dist = distance(color, u_palette[i]);
		if (dist < minDistance) {
			minDistance = dist;
			closestIndex = i;
		}
	}

	return float(closestIndex);
}

void main() {
	uint glyph = 35U;
	float bgIndex = getClosestPaletteIndex(v_colour);

	fragColour = vec4(
		float(glyph >> 8) / 256.0,
		float(glyph & 255U) / 256.0,
		bgIndex / 256.0,
		0.0
	);
}
