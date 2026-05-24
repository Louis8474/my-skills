# Lifecycle and Disposal

EASEL.js does not expose WebGL/WebGPU device resources. Cleanup still matters for arrays, images, and detached canvases.

Common cleanup calls:

```ts
mesh.geometry?.dispose();
material.dispose();
texture.dispose();
renderer.dispose();
```

Chunk replacement pattern:

```ts
const old = meshes.get(key);
if (old) {
	scene.remove(old);
	old.geometry?.dispose();
	meshes.delete(key);
}

const mesh = new EASEL.Mesh(geometry, sharedMaterial);
meshes.set(key, mesh);
scene.add(mesh);
```

Renderer lifecycle:

- create one renderer per canvas
- stop animation loop before disposal
- remove input listeners separately
- call `renderer.dispose()` when canvas renderer is no longer needed

Material sharing:

- share atlas materials across many meshes
- dispose shared materials only after all meshes using them have been removed
