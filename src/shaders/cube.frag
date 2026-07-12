#version 300 es

precision mediump float;

in mat3 v_TBN;
in vec3 v_position;
in vec2 v_uv_coord;

uniform sampler2D u_cube_texture;
uniform sampler2D u_cube_normal;

out vec4 frag_colour;

void main() {
	vec3 normal_col = texture(u_cube_normal, v_uv_coord).rgb;
	vec3 normal = normal_col * 2.0 - 1.0;
	normal = normalize(v_TBN * normal);

	vec3 light = vec3(1.0, -1.0, 1.0); // fixed position
	light = normalize(light - v_position);

	float lam = max(dot(normal, light), 0.0);

	vec3 colour = texture(u_cube_texture, v_uv_coord).rgb;

	frag_colour = vec4(lam * colour, 1.0);
}
