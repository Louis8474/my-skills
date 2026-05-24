# Voxel Worlds

Practical EASEL.js voxel pattern:

- Build `Geometry` from visible block faces.
- Use one shared opaque atlas material and one shared transparent atlas material.
- Split transparent blocks into separate meshes/pass.
- Rebuild dirty chunks only.
- Cap rebuilds per frame.
- Dispose old chunk geometries when replacing meshes.

Chunk mesh add pattern:

```ts
const mesh = new EASEL.Mesh(geometry, material);
scene.add(mesh);
```

Offset positions before bounding sphere:

```ts
const attr = geometry.getAttribute("position");
if (attr) {
	const pos = attr.array as Float32Array;
	for (let i = 0; i < pos.length; i += 3) {
		pos[i] += offsetX;
		pos[i + 2] += offsetZ;
	}
	geometry.computeBoundingSphere();
}
```

Face visibility rule:

```ts
function shouldRenderFace(block: number, neighbor: number, isTransparent: (id: number) => boolean) {
	if (neighbor === 0) return true;
	if (isTransparent(block) && neighbor !== block) return true;
	if (!isTransparent(block) && isTransparent(neighbor)) return true;
	return false;
}
```
