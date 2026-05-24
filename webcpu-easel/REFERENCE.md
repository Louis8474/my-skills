# WebCPU EASEL.js Reference

Baseline: `@xsyetopz/easel@0.5.0`. This reference set is prompt context for AI agents. Read it before generating EASEL.js code.

## Agent Lookup Order

1. `api-index.md` for exported symbols.
2. `class-signatures.md` for constructor, method, and property shape.
3. Runtime docs: `module-imports.md`, `setup.md`, or `deno-runtime.md`.
4. Task-specific recipe doc below.
5. Installed package declarations when a task is missing.
6. `UNKNOWN` when no source verifies the symbol or behavior.

## Agent Output Contract

- Cite the reference file used when explaining non-trivial EASEL.js choices.
- Use exact exported names from `api-index.md`.
- Keep examples copy-safe: include imports, canvas lookup, renderer creation, scene, camera, render call, and disposal when relevant.
- State runtime assumptions: browser DOM canvas, Deno-managed browser app, or bundler app.
- Reject mismatched APIs directly: WebGL/WebGPU, CreateJS EaselJS, and THREE.js are not EASEL.js APIs.

## Reference Map

### Identity and runtime
- `reference/version-provenance.md` -- package version and source URLs.
- `reference/package-identity.md` -- what EASEL.js means in this skill.
- `reference/module-imports.md` -- npm, Bun, JSR, Deno, ESM, and CommonJS import forms.
- `reference/deno-runtime.md` -- Deno import modes, browser-canvas constraints, and validation.
- `reference/type-inspection-guide.md` -- how to inspect package types.

### Generated API facts
- `reference/api-index.md` -- export list grouped by package folder.
- `reference/class-signatures.md` -- extracted class signatures for core surfaces.
- `reference/enums-constants.md` -- constants and literal numeric values.

### Core concepts and pipeline
- `reference/core-concepts.md` -- scene graph, transforms, hierarchy.
- `reference/renderer-framebuffer.md` -- renderer, framebuffer, Canvas2D upload.
- `reference/render-pipeline.md` -- traversal, fog, sorting, light bake, rasterization.
- `reference/cpu-rasterizer-constraints.md` -- CPU renderer constraints and tradeoffs.
- `reference/lifecycle-disposal.md` -- cleanup and replacement patterns.

### Scene construction
- `reference/cameras-controls.md` -- camera constructors and orbit recipe.
- `reference/geometry-builtins.md` -- built-in geometry constructors.
- `reference/geometry-manual.md` -- manual geometry buffers.
- `reference/materials.md` -- materials, side, layer, opacity, shading.
- `reference/lights-fog.md` -- lights and fog.
- `reference/textures-assets.md` -- textures, `DataTexture`, atlases.

### Runtime recipes
- `reference/render-loop-recipes.md` -- loops, resize, profiling.
- `reference/input-picking.md` -- pointer scaling, `Raycaster`, voxel DDA.
- `reference/animation.md` -- clips, tracks, animator.
- `reference/voxel-worlds.md` -- chunk meshing and rebuild budgets.
- `reference/sprites-lines-points.md` -- non-mesh primitives.
- `reference/loaders-serialization.md` -- loader availability and safe use.
- `reference/performance.md` -- optimization checklist.

### Migration and comparison
- `reference/threejs-migration.md` -- concept mapping from THREE.js.
- `reference/createjs-easeljs-comparison.md` -- capability comparison with CreateJS EaselJS.
- `reference/webgl-webgpu-comparison.md` -- backend capability matrix.

### Applied architecture patterns
- `reference/renderer-orchestration.md` -- renderer/camera/scene subsystem ownership.
- `reference/chunked-voxel-terrain.md` -- chunk streaming, rebuild, and replacement.
- `reference/texture-atlas-pipeline.md` -- CPU atlas construction and `DataTexture` upload.
- `reference/hierarchical-voxel-rigging.md` -- grouped cuboid rigs and animation.
- `reference/pointer-input-and-grid-picking.md` -- pointer scaling and DDA grid picking.

## Examples

- `examples/basic-setup.ts`
- `examples/animated-cube.ts`
- `examples/orbit-camera.ts`
- `examples/manual-geometry.ts`
- `examples/texture-atlas.ts`
- `examples/fog-and-lighting.ts`
- `examples/frame-profiling.ts`
- `examples/voxel-chunk-mesher.ts`
- `examples/voxel-picking.ts`
- `examples/skinned-voxel-animation.ts`
- `examples/responsive-canvas.ts`
- `examples/data-texture-from-canvas.ts`

## Templates

- `templates/vite-vanilla-ts`
- `templates/react-canvas`
- `templates/astro-canvas`
- `templates/voxel-world-starter`
- `templates/deno-browser`
