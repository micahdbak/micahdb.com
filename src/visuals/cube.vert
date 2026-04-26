#version 300 es

in vec3 a_position, a_colour;

uniform mat4 u_worldMatrix, u_viewMatrix;

out vec3 v_colour;

void main() {
	v_colour = a_colour;
	gl_Position = u_viewMatrix * u_worldMatrix * vec4(a_position, 1.0);
}
