precision mediump float;

uniform sampler2D u_glyphAtlas;

varying vec3 v_colour;
varying vec2 v_uvCoord;

void main() {
	vec4 sampled = texture2D(u_glyphAtlas, v_uvCoord);
	float mask = clamp(sampled.a, 0.0, 1.0);
	gl_FragColor = vec4(v_colour * mask, mask);
}
