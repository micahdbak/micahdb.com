#version 300 es

precision mediump float;

const float PI = 3.14159265359;

in mat3 v_TBN;
in vec3 v_position;
in vec2 v_uv_coord;
in vec3 v_light;

uniform sampler2D u_texture;
uniform sampler2D u_normal;
uniform sampler2D u_roughness;
uniform float u_ambient;
uniform float u_light_intensity;

out vec4 frag_colour;

void main() {
	vec3 col = texture(u_texture, v_uv_coord).rgb;

	if (v_light == vec3(0.0)) {
		frag_colour = vec4(col, 1.0);
		return;
	}

	vec3 normal = texture(u_normal, v_uv_coord).rgb;
	normal = normal * 2.0 - 1.0;
	normal = normalize(v_TBN * normal);

	float roughness = texture(u_roughness, v_uv_coord).r;
	float shininess = max(2.0 / pow(max(roughness, 1.0e-4), 4.0) - 2.0, 1.0);

	vec3 L = normalize(v_light - v_position);

	// ambient lighting
	float amb = u_ambient;

	// lambertian diffuse component
	float lam = max(dot(normal, L), 0.0);

	// blinn-phong specular component
	vec3 V = normalize(-v_position);
	vec3 H = normalize(L + V);
	float spec_strength = pow(1.0 - roughness, 2.0);
	float spec = pow(max(dot(normal, H), 0.0), shininess) * step(0.0, lam)
		* ((shininess + 8.0) / (8.0 * PI));

	vec3 shaded = col * min(amb + u_light_intensity * lam, 1.0) * (1.0 - spec_strength)
		+ spec_strength * u_light_intensity * spec;

	frag_colour = vec4(shaded, 1.0);
}
