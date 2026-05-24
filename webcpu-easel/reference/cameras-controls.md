# Cameras and Controls

Public camera exports:

- `PerspectiveCamera`
- `OrthographicCamera`
- `OrbitControls`

Perspective constructor:

```ts
new EASEL.PerspectiveCamera({ fov?: number, aspect?: number, near?: number, far?: number, tileSize?: number })
```

Orthographic constructor:

```ts
new EASEL.OrthographicCamera({ left?: number, right?: number, top?: number, bottom?: number, near?: number, far?: number, tileSize?: number })
```

Orbit camera without relying on controls:

```ts
function syncOrbitCamera(camera: EASEL.PerspectiveCamera, target: EASEL.Vector3, azimuth: number, elevation: number, distance: number) {
	const cosElev = Math.cos(elevation);
	const x = target.x + distance * cosElev * Math.sin(azimuth);
	const y = target.y + distance * Math.sin(elevation);
	const z = target.z + distance * cosElev * Math.cos(azimuth);
	camera.position.set(x, y, z);
	camera.lookAt(target);
}
```

Resize recipe:

```ts
renderer.setSize(width, height);
camera.aspect = width / height;
camera.updateProjectionMatrix();
```
