import * as EASEL from "@xsyetopz/easel";

export function dataTextureFromCanvas(
	canvas: HTMLCanvasElement,
): EASEL.DataTexture {
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	if (!ctx) throw new Error("Missing 2D context");
	const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const texture = new EASEL.DataTexture(
		new Uint8ClampedArray(image.data),
		image.width,
		image.height,
	);
	texture.needsUpdate = true;
	return texture;
}
