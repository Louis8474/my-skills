# Performance

CPU rasterizer performance checklist:

- Lower internal render resolution first.
- Avoid rebuilding geometry every frame.
- Share materials/textures.
- Split static and dynamic scene branches.
- Keep transparent geometry limited and ordered.
- Use fog and render distance to reduce far geometry.
- Profile with `RenderTimings`.
- Dispose replaced geometries.

Frame budget profiler:

```ts
const timings: EASEL.RenderTimings = { profileTraversal: true };
renderer.render(scene, camera, timings);
console.table(timings);
```

Voxel strategy:

```ts
const MAX_REBUILDS_PER_FRAME = 2;
let rebuilt = 0;
for (const chunk of dirtyChunks) {
	if (rebuilt >= MAX_REBUILDS_PER_FRAME) break;
	rebuild(chunk);
	rebuilt++;
}
```
