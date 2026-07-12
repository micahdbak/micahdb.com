#version 300 es

precision mediump float;

in vec3 v_position;

uniform samplerCube u_skybox_texture;

out vec4 frag_colour;

void main() {
	vec3 col = texture(u_skybox_texture, v_position).rgb;
	frag_colour = vec4(col, 1.0);
}
