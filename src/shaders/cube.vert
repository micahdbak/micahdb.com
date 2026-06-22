#version 300 es

in vec3 a_position;
in vec3 a_normal;
in vec3 a_tangent;
in vec2 a_uv_coord;

uniform mat4 u_projection_matrix;
uniform mat4 u_view_matrix;
uniform mat4 u_model_matrix;
uniform mat3 u_normal_matrix;

out mat3 v_TBN;
out vec3 v_position;
out vec2 v_uv_coord;

void main() {
	mat4 model_view_matrix = u_view_matrix * u_model_matrix;

	vec3 N = u_normal_matrix * a_normal;
	vec3 T = mat3(model_view_matrix) * a_tangent;
	vec3 B = cross(N, T);

	v_TBN = mat3(T, B, N);
	v_position = vec3(model_view_matrix * vec4(a_position, 1.0));
	v_uv_coord = a_uv_coord;

	gl_Position = u_projection_matrix * model_view_matrix * vec4(a_position, 1.0);
}
