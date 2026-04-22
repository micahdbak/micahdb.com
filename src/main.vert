attribute vec2 a_position;
attribute vec3 a_bgColour;
attribute vec3 a_fgColour;
attribute vec2 a_uvCoord;

uniform mat4 u_projection;

varying vec3 v_bgColour;
varying vec3 v_fgColour;
varying vec2 v_uvCoord;

void main() {
	v_bgColour = a_bgColour;
	v_fgColour = a_fgColour;
	v_uvCoord = a_uvCoord;
	gl_Position = u_projection * vec4(a_position, 0.0, 1.0);
}
