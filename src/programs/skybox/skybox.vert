#version 300 es

in vec3 a_position;

uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;

out vec3 v_position;

void main() {
	v_position = a_position;
	mat4 staticViewMatrix = mat4(mat3(u_viewMatrix)); // remove translation
	
	// when dividing z (w) by w, each vertex will have z value of 1; i.e., inf far away
	gl_Position = (u_projectionMatrix * staticViewMatrix * vec4(a_position, 1.0)).xyww;
}
