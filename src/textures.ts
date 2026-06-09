// renderer

export const GLYPH_ATLAS_TEXTURE_INDEX = 0;
export const GLYPH_ATLAS_TEXTURE_PATH = "/glyphatlas.png";

export const PROGRAM_TEXTURE_INDEX = 1;

// misc textures

export const WHITE_TEXTURE_PATH = "/white.png";
export const SMOOTH_NORMAL_PATH = "/smooth.png";

// cube program

export const CUBE_TEXTURE_INDEX = 2;
export const CUBE_NORMAL_INDEX = 3;
export const CUBE_TEXTURE_PATH = "/cube/texture.jpg";
export const CUBE_NORMAL_PATH = "/cube/normal.jpg";

// globe program

export const GLOBE_TEXTURE_INDEX = 2;
export const GLOBE_NORMAL_INDEX = 3;
export const EARTH_TEXTURE_PATH = "/globe/texture.jpg";
export const EARTH_NORMAL_PATH = "/globe/normal.jpg";

// misc functions

export function loadTexture(
	gl: WebGL2RenderingContext,
	path: string
): Promise<WebGLTexture> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.src = path;
		image.onload = () => {
			const tex = gl.createTexture();
			if (!tex) {
				reject(new Error("When creating GL texture"));
				return;
			}

			gl.bindTexture(gl.TEXTURE_2D, tex);

			// prevent texture halos/outlines from filtering
			gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				gl.RGBA,
				gl.RGBA,
				gl.UNSIGNED_BYTE,
				image
			);

			gl.generateMipmap(gl.TEXTURE_2D);

			gl.texParameteri(
				gl.TEXTURE_2D,
				gl.TEXTURE_MIN_FILTER,
				gl.LINEAR_MIPMAP_LINEAR
			);

			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

			resolve(tex);
		};
	});
}
