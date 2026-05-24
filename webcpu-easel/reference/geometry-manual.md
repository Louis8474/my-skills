# Manual Geometry

`Geometry` stores vertex attributes and an optional triangle index.

Public methods:

- `setPositions(Float32Array | number[])`
- `setUVs(Float32Array | number[])`
- `setColors(Float32Array | number[])`
- `setNormals(Float32Array | number[])`
- `setIndex(Uint16Array | Uint32Array | number[])`
- `getAttribute(name)`
- `setAttribute(name, attribute)`
- `deleteAttribute(name)`
- `computeVertexNormals()`
- `computeBoundingSphere()`
- `dispose()`

Triangle recipe:

```ts
const geometry = new EASEL.Geometry();
geometry.setPositions(new Float32Array([
	0, 1, 0,
	-1, -1, 0,
	1, -1, 0,
]));
geometry.setNormals(new Float32Array([
	0, 0, 1,
	0, 0, 1,
	0, 0, 1,
]));
geometry.setUVs(new Float32Array([
	0.5, 0,
	0, 1,
	1, 1,
]));
geometry.setIndex(new Uint16Array([0, 1, 2]));
geometry.computeBoundingSphere();
```

Voxel face recipe:

- emit 4 vertices per face when UVs differ per face
- emit 6 indices per quad
- store normals per vertex
- compute bounding sphere after all offsets/mutations

```ts
indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
```
