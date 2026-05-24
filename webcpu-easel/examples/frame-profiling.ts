import type * as EASEL from "@xsyetopz/easel";

export function renderWithTiming(
	renderer: EASEL.Renderer,
	scene: EASEL.Scene,
	camera: EASEL.PerspectiveCamera,
): Record<string, number | boolean | undefined> {
	const timings: Record<string, number | boolean | undefined> = {
		profileTraversal: true,
	};
	renderer.render(scene, camera, timings);
	return timings;
}
