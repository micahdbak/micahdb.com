#version 300 es

precision mediump float;

in mat3 v_TBN;
in vec3 v_position;
in vec2 v_uv_coord;
in vec3 v_light;

uniform sampler2D u_texture;
uniform sampler2D u_normal;
uniform sampler2D u_roughness;

out vec4 frag_colour;

void main() {
	vec3 col = texture(u_texture, v_uv_coord).rgb;

	vec3 normal = texture(u_normal, v_uv_coord).rgb;
	normal = normal * 2.0 - 1.0;
	normal = normalize(v_TBN * normal);

	float roughness = texture(u_roughness, v_uv_coord).r;
	float smoothness = 1.0 - roughness;
	float shininess = pow(smoothness, 3.0) * 128.0 + 1.0;

	vec3 light = normalize(v_light);

	// ambient lighting
	float amb = 2.0 / 12.0;

	// lambertian diffuse component
	float lam = max(dot(normal, light), 0.0);

	// blinn-phong specular component
	vec3 L = normalize(v_light - v_position);
	vec3 V = normalize(-v_position);
	vec3 H = normalize(L + V);
	float spec = pow(max(dot(normal, H), 0.0), shininess);

	frag_colour = vec4((amb + lam) * col + spec, 1.0);
}
