import type * as EASEL from "@xsyetopz/easel";

export function resizeRenderer(
	renderer: EASEL.Renderer,
	camera: EASEL.PerspectiveCamera,
	width: number,
	height: number,
): void {
	renderer.setSize(width, height);
	camera.aspect = width / height;
	camera.updateProjectionMatrix();
}
