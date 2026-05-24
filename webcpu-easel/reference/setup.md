# Setup

Use when an agent must add EASEL.js to a project or verify the first render path.

## Agent Setup Order

1. Detect runtime and package manager.
2. Prefer installed project version unless the user asks to upgrade.
3. Use `@xsyetopz/easel@0.5.0` when no project version exists.
4. Verify import with `EASEL.REVISION` before writing larger scene code.
5. Verify render with a real `HTMLCanvasElement` before adding controls, loaders, or game logic.

## Package Baseline

```bash
npm install @xsyetopz/easel@0.5.0
bun add @xsyetopz/easel@0.5.0
pnpm add @xsyetopz/easel@0.5.0
yarn add @xsyetopz/easel@0.5.0
```

For Deno, use `reference/deno-runtime.md`.

## Minimal Runtime Requirements

- Browser DOM with `HTMLCanvasElement`.
- Canvas2D support.
- TypeScript or JavaScript ESM support.
- A render loop using `requestAnimationFrame`.

## Preferred First Import

```ts
import * as EASEL from "@xsyetopz/easel";
```

## First Validation Step

```ts
console.log(EASEL.REVISION);
```

Expected baseline output: `0.5.0`.

## Do Not

- Do not render in server-only code unless a DOM/canvas-compatible environment is explicitly provided.
- Do not introduce WebGL/WebGPU setup.
- Do not assume package manager from filename alone when lockfiles or existing imports disagree.
