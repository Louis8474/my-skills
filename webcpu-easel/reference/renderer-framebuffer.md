# Renderer and Framebuffer

`Renderer` orchestrates the CPU pipeline and uploads the software framebuffer to a Canvas2D context.

Constructor:

```ts
new Renderer({ width?: number, height?: number, canvas?: HTMLCanvasElement, pixelRatio?: number })
```

Public properties/methods:

- `domElement: HTMLCanvasElement | undefined`
- `width: number`
- `height: number`
- `pixelRatio: number`
- `render(scene, camera, timings?)`
- `setSize(width, height)`
- `setPixelRatio(ratio)`
- `setClearColor(Color | hex | r,g,b)`
- `dispose()`

Renderer setup:

```ts
const renderer = new EASEL.Renderer({ width: 320, height: 180, canvas });
renderer.setClearColor(0x000000);
```

Canvas sizing model:

- `width` and `height` are internal render target dimensions.
- Canvas CSS size can differ from internal resolution for pixel-art scaling.
- `setSize` resizes framebuffer and canvas backing store.
- CPU work scales with internal pixel count, not CSS size.

Profiling:

```ts
const timings: EASEL.RenderTimings = { profileTraversal: true };
renderer.render(scene, camera, timings);
console.log(timings.totalMs, timings.shadeRasterMs, timings.uploadMs);
```
