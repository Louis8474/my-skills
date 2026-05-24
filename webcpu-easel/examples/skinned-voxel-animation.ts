import * as EASEL from "@xsyetopz/easel";

class StepTrack extends EASEL.Track {
	override interpolate(index: number): number[] {
		const offset = index * this.itemSize;
		return Array.from(this.values.subarray(offset, offset + this.itemSize));
	}
}

export function makeTwoJointModel(texture: EASEL.DataTexture) {
	const material = new EASEL.BasicMaterial({
		map: texture,
		side: EASEL.Side.Front,
	});
	const root = new EASEL.Group();
	root.name = "Root";
	const arm = new EASEL.Group();
	arm.name = "Arm";
	arm.position.set(0.6, 0.8, 0);
	arm.add(new EASEL.Mesh(new EASEL.BoxGeometry(0.25, 0.8, 0.25), material));
	root.add(arm);
	const track = new StepTrack(
		"Arm.rotation.z",
		[0, 0.5, 1],
		[0.4, -0.4, 0.4],
		1,
	);
	const clip = new EASEL.AnimationClip("wave", 1, [track]);
	const animator = new EASEL.Animator(root);
	animator
		.clipAction(clip)
		.setLoop(EASEL.LoopRepeat, Number.POSITIVE_INFINITY)
		.play();
	return { root, animator };
}
