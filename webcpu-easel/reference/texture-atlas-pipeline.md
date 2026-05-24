# Texture Atlas Pipeline Pattern

Use this pattern when source images contain tiles or sprites that need CPU-side packing before `DataTexture` upload.

Pattern:

- Load an image with `HTMLImageElement` or `ImageBitmap`.
- Draw source pixels to a scratch canvas.
- Read `ImageData` from a context created with `{ willReadFrequently: true }`.
- Copy selected tile pixels into a compact atlas `Uint8ClampedArray`.
- Create `DataTexture` from atlas bytes.
- Set `texture.needsUpdate = true` after data changes.

Core recipe:

```ts
const texture = new EASEL.DataTexture(atlasData, atlasSize, atlasSize);
texture.needsUpdate = true;
```

Use typed array copying for predictable CPU performance.
