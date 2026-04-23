#version 300 es

precision mediump float;

uniform sampler2D u_glyphAtlas;

in vec3 v_bgColour;
in vec3 v_fgColour;
in vec2 v_uvCoord;

out vec4 fragColor;

void main() {
	// nothing to render here; discard the fragment
	if (v_uvCoord == vec2(0.0, 0.0) && v_bgColour == vec3(0.0)) {
		discard;
	}

	vec4 glyphSample = texture(u_glyphAtlas, v_uvCoord);
	float fgMask = clamp(glyphSample.a, 0.0, 1.0);
	float bgMask = 1.0 - fgMask;
	fragColor = vec4(v_bgColour * bgMask, bgMask) + vec4(v_fgColour * fgMask, fgMask);
}
