# Type Inspection Guide

Use this when a task needs an API not covered by bundled references.

1. Find installed package:

```bash
node -e 'console.log(require.resolve("@xsyetopz/easel/package.json"))'
```

2. Read root types:

```bash
sed -n '1,240p' node_modules/@xsyetopz/easel/dist/index.d.ts
```

3. Locate the class file from the export path in `index.d.ts`.

4. Read the class declaration and options interface.

5. Use only public declarations. Private `#private` members in `.d.ts` are not callable.

6. If declarations and source disagree, prefer declarations for app code and note the mismatch.

Typical files:

- Renderer: `dist/renderers/Renderer.d.ts`
- Geometry: `dist/geometry/Geometry.d.ts`
- Materials: `dist/materials/*.d.ts`
- Cameras: `dist/cameras/*.d.ts`
- Node/Scene/Raycaster: `dist/core/*.d.ts`
- Textures: `dist/textures/*.d.ts`
- Animation: `dist/animation/*.d.ts`
- Constants: `dist/core/Constants.d.ts`
