# Input and Picking

Pointer coordinate scaling:

```ts
const rect = canvas.getBoundingClientRect();
const scaleX = canvas.width / rect.width;
const scaleY = canvas.height / rect.height;
const x = (event.clientX - rect.left) * scaleX;
const y = (event.clientY - rect.top) * scaleY;
```

`Raycaster` supports object intersection from a camera using normalized device coordinates:

```ts
const ndc = { x: (x / canvas.width) * 2 - 1, y: 1 - (y / canvas.height) * 2 };
const raycaster = new EASEL.Raycaster();
raycaster.setFromCamera(ndc, camera);
const hits = raycaster.intersectObject(scene, true);
```

Voxel worlds often use custom DDA picking instead of mesh triangle picking. Recipe:

1. Convert pointer to camera ray.
2. Step through voxel cells along ray.
3. Return first non-air cell and hit face normal.
4. Limit max distance.

Use `examples/voxel-picking.ts` for a complete DDA implementation.
