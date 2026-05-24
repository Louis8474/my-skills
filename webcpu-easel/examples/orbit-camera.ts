import type * as EASEL from "@xsyetopz/easel";

export function syncOrbitCamera(
	camera: EASEL.PerspectiveCamera,
	target: EASEL.Vector3,
	azimuth: number,
	elevation: number,
	distance: number,
): void {
	const cosElev = Math.cos(elevation);
	const x = target.x + distance * cosElev * Math.sin(azimuth);
	const y = target.y + distance * Math.sin(elevation);
	const z = target.z + distance * cosElev * Math.cos(azimuth);
	camera.position.set(x, y, z);
	camera.lookAt(target);
}
