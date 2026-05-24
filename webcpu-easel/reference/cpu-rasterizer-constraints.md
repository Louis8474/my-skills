# CPU Rasterizer Constraints

EASEL.js renders in CPU memory and uploads pixels to Canvas2D. Design scenes around CPU costs.

Practical constraints:

- Internal resolution dominates cost. Start low (for example 320×180 or 480×270) and scale with CSS.
- Triangle count and overdraw matter. Painter sorting plus scanline fill is CPU work.
- Texture sampling is CPU-side. Use compact atlases and small pixel-art textures for retro scenes.
- `Material.opacity` is discrete in the base material: 0 opaque, 8 nearly transparent.
- Transparent or semi-transparent surfaces need predictable draw order. Split transparent geometry when needed.
- Geometry rebuilds allocate arrays and should be budgeted across frames.
- Dispose replaced geometries/materials/textures when they are no longer used.

Useful defaults:

```ts
const renderer = new EASEL.Renderer({ width: 320, height: 180, canvas });
const material = new EASEL.BasicMaterial({ side: EASEL.Side.Front, shading: EASEL.Shading.Flat });
```

For voxel worlds:

- share materials per atlas/pass
- split opaque and transparent meshes
- rebuild only dirty chunks
- cap rebuilds per frame
- compute bounding spheres after mutating position arrays
