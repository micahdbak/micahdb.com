precision mediump float;

uniform sampler2D u_glyphAtlas;

varying vec3 v_bgColour;
varying vec3 v_fgColour;
varying vec2 v_uvCoord;

void main() {
	vec4 glyphSample = texture2D(u_glyphAtlas, v_uvCoord);
	float fgMask = clamp(glyphSample.a, 0.0, 1.0);
	float bgMask = 1.0 - fgMask;
	gl_FragColor = vec4(v_bgColour * bgMask, bgMask) + vec4(v_fgColour * fgMask, fgMask);
}
