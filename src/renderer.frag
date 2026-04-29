#version 300 es

#define PALETTE_SIZE 18

precision mediump float;

uniform sampler2D u_glyphAtlas;
uniform highp vec3 u_palette[PALETTE_SIZE];

in vec3 v_bgColour;
in vec3 v_fgColour;
in vec2 v_uvCoord;
flat in uint v_charCode;

out vec4 fragColor;

void main() {
	if (v_charCode == 0U && (v_bgColour == u_palette[0] || v_bgColour == u_palette[16])) {
		discard;
	}

	vec4 glyphSample = texture(u_glyphAtlas, v_uvCoord);
	float fgMask = clamp(glyphSample.a, 0.0, 1.0);
	float bgMask = 1.0 - fgMask;
	fragColor = vec4(v_bgColour * bgMask, bgMask) + vec4(v_fgColour * fgMask, fgMask);
}
