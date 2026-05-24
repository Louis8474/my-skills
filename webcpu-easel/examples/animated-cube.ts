import * as EASEL from "@xsyetopz/easel";

export function createAnimatedCube() {
	const cube = new EASEL.Mesh(
		new EASEL.BoxGeometry(1, 1, 1),
		new EASEL.LambertMaterial({
			color: 0x44aaff,
			shading: EASEL.Shading.Gouraud,
		}),
	);
	cube.name = "Cube";
	const track = new EASEL.Track("Cube.rotation.y", [0, 1], [0, Math.PI * 2], 1);
	const clip = new EASEL.AnimationClip("spin", 1, [track]);
	const root = new EASEL.Group();
	root.add(cube);
	const animator = new EASEL.Animator(root);
	animator
		.clipAction(clip)
		.setLoop(EASEL.LoopRepeat, Number.POSITIVE_INFINITY)
		.play();
	return { root, cube, animator };
}
