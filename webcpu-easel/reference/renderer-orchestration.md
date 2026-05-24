# Renderer Orchestration Pattern

Use this pattern when an app owns the canvas, camera, scene, fog, and per-frame render call in one rendering subsystem.

Pattern:

- Create `Renderer` with fixed internal width/height and supplied canvas.
- Create one long-lived `Scene`.
- Create `PerspectiveCamera` with config-derived `fov`, `aspect`, `near`, and `far`.
- Create `Fog`, assign `scene.fog`, and set clear color before rendering.
- Use orbit-camera math or another camera controller to set camera position and `lookAt` target.
- Call `scene.updateMatrixWorld()` before `renderer.render(scene, camera)` when transforms changed outside renderer-managed traversal.

Recipe:

```ts
const renderer = new EASEL.Renderer({ width, height, canvas });
const scene = new EASEL.Scene();
const camera = new EASEL.PerspectiveCamera({ fov, aspect: width / height, near, far });
scene.fog = new EASEL.Fog({ color: new EASEL.Color(0, 0, 0), near: fogStart, far: fogEnd });
renderer.setClearColor(0, 0, 0);
```
