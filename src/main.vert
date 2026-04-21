attribute vec2 a_position;
attribute vec3 a_colour;

uniform mat4 u_projection;

varying vec3 v_colour;

void main() {
	v_colour = a_colour;
	gl_Position = u_projection * vec4(a_position, 0.0, 1.0);
}
