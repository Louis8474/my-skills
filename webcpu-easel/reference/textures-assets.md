# Textures and Assets

Texture exports:

- `Texture`
- `DataTexture`
- `CanvasTexture`
- `FramebufferTexture`
- `VideoTexture`
- loaders: `TextureLoader`, `ImageLoader`, `ImageBitmapLoader`, `DataTextureLoader`

`DataTexture` constructor:

```ts
new EASEL.DataTexture(data: Uint8ClampedArray, width: number, height: number)
```

Atlas recipe:

```ts
const atlasData = new Uint8ClampedArray(atlasWidth * atlasHeight * 4);
// Fill RGBA bytes.
const texture = new EASEL.DataTexture(atlasData, atlasWidth, atlasHeight);
texture.needsUpdate = true;
```

Canvas-to-texture recipe:

```ts
const ctx = sourceCanvas.getContext("2d", { willReadFrequently: true });
if (!ctx) throw new Error("Missing 2D context");
const image = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
const texture = new EASEL.DataTexture(new Uint8ClampedArray(image.data), image.width, image.height);
texture.needsUpdate = true;
```

Pixel-art guidance:

- Build compact atlases.
- Use deterministic UV rectangles.
- Set `needsUpdate = true` after mutating texture data/source.
- Keep texture dimensions small enough for CPU sampling costs.
