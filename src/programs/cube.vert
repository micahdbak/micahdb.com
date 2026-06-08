#version 300 es

in vec3 a_position;
in vec3 a_normal;
in vec3 a_tangent;
in vec2 a_uvCoord;

uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_modelMatrix;
uniform mat3 u_normalMatrix;

out mat3 v_TBN;
out vec3 v_position;
out vec2 v_uvCoord;

void main() {
	mat4 modelViewMatrix = u_viewMatrix * u_modelMatrix;

	vec3 N = u_normalMatrix * a_normal;
	vec3 T = mat3(modelViewMatrix) * a_tangent;
	vec3 B = cross(N, T);

	v_TBN = mat3(T, B, N);
	v_position = vec3(modelViewMatrix * vec4(a_position, 1.0));
	v_uvCoord = a_uvCoord;

	gl_Position = u_projectionMatrix * modelViewMatrix * vec4(a_position, 1.0);
}
