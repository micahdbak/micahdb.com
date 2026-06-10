import VERTEX_SHADER from "./skybox.vert" with { type: "text" };
import FRAGMENT_SHADER from "./skybox.frag" with { type: "text" };

import {
	EARTH_SKYBOX_FACES,
	SKYBOX_TEXTURE_INDEX,
	loadCubeMap
} from "../../textures.ts";
import { Program } from "../../program.ts";
import { CubeMesh } from "../meshes/cube.ts";

export class SkyboxProgram extends Program {
	private attributes: {
		position: number;
	};

	private uniforms: {
		projectionMatrix: WebGLUniformLocation;
		viewMatrix: WebGLUniformLocation;
		skyboxTexture: WebGLUniformLocation;
	};

	private vbo: WebGLBuffer;
	private skyboxTexture: WebGLTexture;
	private cube: CubeMesh;

	async init() {
		this.loadProgram(VERTEX_SHADER, FRAGMENT_SHADER);
		this.initializeLocations();

		this.vbo = this.gl.createBuffer();
		if (!this.vbo) {
			throw new Error("When creating vertex buffer");
		}

		await this.initializeTexture();

		this.cube = new CubeMesh();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
		this.gl.bufferData(
			this.gl.ARRAY_BUFFER,
			this.cube.data(),
			this.gl.STATIC_DRAW
		);
	}

	initializeLocations() {
		this.gl.useProgram(this.glProgram);

		// store attribute locations
		this.attributes = {
			position: this.gl.getAttribLocation(this.glProgram, "a_position")
		};

		if (this.attributes.position < 0) {
			throw new Error("When getting attribute locations");
		}

		const projectionMatrix = this.gl.getUniformLocation(
			this.glProgram,
			"u_projectionMatrix"
		);
		const viewMatrix = this.gl.getUniformLocation(
			this.glProgram,
			"u_viewMatrix"
		);
		const skyboxTexture = this.gl.getUniformLocation(
			this.glProgram,
			"u_skyboxTexture"
		);

		if (!projectionMatrix || !viewMatrix || !skyboxTexture) {
			throw new Error("When getting uniform locations");
		}

		// store uniform locations
		this.uniforms = {
			projectionMatrix,
			viewMatrix,
			skyboxTexture
		};
	}

	async initializeTexture() {
		this.skyboxTexture = await loadCubeMap(this.gl, EARTH_SKYBOX_FACES);

		this.gl.useProgram(this.glProgram);
		this.gl.uniform1i(this.uniforms.skyboxTexture, SKYBOX_TEXTURE_INDEX);
	}

	enablePositionAttribute(
		gl: WebGL2RenderingContext,
		vbo: WebGLBuffer,
		attribute: number
	) {
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.vertexAttribPointer(attribute, 3, gl.FLOAT, false, 44, 0);
		gl.enableVertexAttribArray(attribute);
	}

	draw(projectionMatrix: Float32Array, viewMatrix: Float32Array) {
		this.gl.useProgram(this.glProgram);

		this.gl.depthFunc(this.gl.LEQUAL);

		this.gl.uniformMatrix4fv(
			this.uniforms.projectionMatrix,
			false,
			projectionMatrix
		);
		this.gl.uniformMatrix4fv(this.uniforms.viewMatrix, false, viewMatrix);

		this.gl.activeTexture(this.gl.TEXTURE0 + SKYBOX_TEXTURE_INDEX);
		this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.skyboxTexture);
		this.gl.uniform1i(this.uniforms.skyboxTexture, SKYBOX_TEXTURE_INDEX);

		this.enablePositionAttribute(this.gl, this.vbo, this.attributes.position);

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
		this.gl.drawArrays(this.gl.TRIANGLES, 0, CubeMesh.NUM_VERTICES);

		this.gl.depthFunc(this.gl.LESS);
	}
}
