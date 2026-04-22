attribute vec2 a_position;
attribute vec3 a_colour;
attribute vec2 a_uvCoord;

uniform mat4 u_projection;

varying vec3 v_colour;
varying vec2 v_uvCoord;

void main() {
	v_colour = a_colour;
	v_uvCoord = a_uvCoord;
	gl_Position = u_projection * vec4(a_position, 0.0, 1.0);
}
