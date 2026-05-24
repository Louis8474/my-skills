# Render Loop Recipes

Basic loop:

```ts
let frameId = 0;
function frame() {
	update();
	scene.updateMatrixWorld();
	renderer.render(scene, camera);
	frameId = requestAnimationFrame(frame);
}
frameId = requestAnimationFrame(frame);
```

Stop loop:

```ts
cancelAnimationFrame(frameId);
renderer.dispose();
```

Delta time:

```ts
let last = performance.now();
function frame(now: number) {
	const dt = Math.min((now - last) / 1000, 0.25);
	last = now;
	animator.update(dt);
	renderer.render(scene, camera);
	requestAnimationFrame(frame);
}
```

Profiling:

```ts
const timings: EASEL.RenderTimings = { profileTraversal: true };
renderer.render(scene, camera, timings);
debug.textContent = `${timings.totalMs?.toFixed(2)}ms`;
```
