import * as EASEL from "@xsyetopz/easel";

export function addFogAndLights(scene: EASEL.Scene): void {
	scene.background = 0x05070a;
	scene.fog = new EASEL.Fog({
		color: 0x05070a,
		near: 10,
		far: 48,
		density: 2.5,
	});
	scene.add(new EASEL.AmbientLight(0xffffff, 0.3));
	const sun = new EASEL.DirectionalLight(0xffffff, 0.8);
	sun.position.set(1, 2, 1);
	scene.add(sun);
}
