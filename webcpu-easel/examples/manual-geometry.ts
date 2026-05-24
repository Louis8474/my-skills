import * as EASEL from "@xsyetopz/easel";

export function createTriangleMesh(): EASEL.Mesh {
	const geometry = new EASEL.Geometry();
	geometry.setPositions(new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0]));
	geometry.setNormals(new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]));
	geometry.setUVs(new Float32Array([0.5, 0, 0, 1, 1, 1]));
	geometry.setIndex(new Uint16Array([0, 1, 2]));
	geometry.computeBoundingSphere();
	return new EASEL.Mesh(
		geometry,
		new EASEL.BasicMaterial({ color: 0xffcc00, side: EASEL.Side.Double }),
	);
}
