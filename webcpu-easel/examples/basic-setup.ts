import * as EASEL from "@xsyetopz/easel";

export function mountBasicScene(canvas: HTMLCanvasElement): () => void {
	const renderer = new EASEL.Renderer({ width: 320, height: 180, canvas });
	const scene = new EASEL.Scene();
	const camera = new EASEL.PerspectiveCamera({
		fov: 60,
		aspect: 320 / 180,
		near: 0.1,
		far: 100,
	});
	camera.position.set(2, 2, 4);
	camera.lookAt(0, 0, 0);
	const mesh = new EASEL.Mesh(
		new EASEL.BoxGeometry(1, 1, 1),
		new EASEL.LambertMaterial({ color: 0xff6644 }),
	);
	scene.add(new EASEL.AmbientLight(0xffffff, 0.35));
	scene.add(mesh);
	let frameId = 0;
	function frame() {
		mesh.rotation.y += 0.02;
		scene.updateMatrixWorld();
		renderer.render(scene, camera);
		frameId = requestAnimationFrame(frame);
	}
	frame();
	return () => {
		cancelAnimationFrame(frameId);
		mesh.geometry?.dispose();
		mesh.material?.dispose();
		renderer.dispose();
	};
}
