#version 300 es

precision mediump float;

in mat3 v_TBN;
in vec3 v_position;
in vec2 v_uv_coord;
in vec3 v_light;

uniform sampler2D u_torus_texture;
uniform sampler2D u_torus_normal;

out vec4 frag_colour;

void main() {
	vec3 normal = texture(u_torus_normal, v_uv_coord).rgb;
	normal = normal * 2.0 - 1.0;
	normal = normalize(v_TBN * normal);

	vec3 light = normalize(v_light);
	float lam = 0.2 + 0.8 * max(1.0 / 12.0, 1.5 * dot(normal, light));

	vec3 col = texture(u_torus_texture, v_uv_coord).rgb;

	frag_colour = vec4(lam * col, 1.0);
}
