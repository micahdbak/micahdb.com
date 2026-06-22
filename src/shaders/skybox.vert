#version 300 es

in vec3 a_position;

uniform mat4 u_projection_matrix;
uniform mat4 u_view_matrix;

out vec3 v_position;

void main() {
	v_position = a_position;
	mat4 static_view_matrix = mat4(mat3(u_view_matrix)); // remove translation
	
	// when dividing z (w) by w, each vertex will have z value of 1; i.e., inf far away
	gl_Position = (u_projection_matrix * static_view_matrix * vec4(a_position, 1.0)).xyww;
}
