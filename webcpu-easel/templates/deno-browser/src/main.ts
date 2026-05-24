import * as EASEL from "@xsyetopz/easel";

type RenderableScene = {
	children: EASEL.Scene["children"];
	visible: EASEL.Scene["visible"];
	background?: EASEL.Color | number | undefined;
	autoUpdate?: EASEL.Scene["autoUpdate"];
	lights?: unknown;
	fog?: EASEL.Fog;
};

function renderScene(
	renderer: EASEL.Renderer,
	scene: EASEL.Scene,
	camera: EASEL.PerspectiveCamera,
): void {
	const renderableScene: RenderableScene = {
		children: scene.children,
		visible: scene.visible,
		background: scene.background,
		autoUpdate: scene.autoUpdate,
	};
	if (scene.fog !== undefined) renderableScene.fog = scene.fog;
	renderer.render(renderableScene, camera);
}

const canvas = document.querySelector<HTMLCanvasElement>("#scene");
if (!canvas) throw new Error("Missing #scene canvas");

const renderer = new EASEL.Renderer({ width: 640, height: 360, canvas });
const scene = new EASEL.Scene();
const camera = new EASEL.PerspectiveCamera({
	fov: 60,
	aspect: 640 / 360,
	near: 0.1,
	far: 100,
});

camera.position.set(2, 2, 4);
camera.lookAt(0, 0, 0);
scene.add(new EASEL.AmbientLight(0xffffff, 0.35));

const cube = new EASEL.Mesh(
	new EASEL.BoxGeometry(1, 1, 1),
	new EASEL.BasicMaterial({ color: 0x66ccff }),
);
scene.add(cube);
console.log(EASEL.REVISION);

function frame(): void {
	cube.rotation.y += 0.02;
	scene.updateMatrixWorld();
	renderScene(renderer, scene, camera);
	requestAnimationFrame(frame);
}

frame();
