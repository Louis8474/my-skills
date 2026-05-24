import * as EASEL from "@xsyetopz/easel";

export function makeCheckerAtlas(size = 16): EASEL.DataTexture {
	const data = new Uint8ClampedArray(size * size * 4);
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const i = (y * size + x) * 4;
			const bright = ((x >> 2) + (y >> 2)) % 2 === 0 ? 240 : 60;
			data[i] = bright;
			data[i + 1] = bright;
			data[i + 2] = bright;
			data[i + 3] = 255;
		}
	}
	const texture = new EASEL.DataTexture(data, size, size);
	texture.needsUpdate = true;
	return texture;
}
