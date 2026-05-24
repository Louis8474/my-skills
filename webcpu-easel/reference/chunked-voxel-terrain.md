# Chunked Voxel Terrain Pattern

Use this pattern for voxel worlds that stream, rebuild, and replace mesh chunks incrementally.

Key patterns:

- Store chunk meshes in a `Map<string, Mesh>` keyed by chunk coordinate.
- Track loaded chunk keys separately from mesh instances.
- Build opaque and transparent sub-chunk geometry separately when alpha sorting matters.
- Remove old mesh from scene, dispose geometry, and delete map entry before replacement.
- Offset local geometry positions to world coordinates, then recompute bounding sphere.
- Limit chunk rebuilds per frame to keep CPU rasterization responsive.

Replacement recipe:

```ts
const old = meshes.get(key);
if (old) {
	scene.remove(old);
	old.geometry?.dispose();
	meshes.delete(key);
}
const mesh = new EASEL.Mesh(geometry, material);
meshes.set(key, mesh);
scene.add(mesh);
```
