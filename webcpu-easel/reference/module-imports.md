# Module Imports

Use when an agent must install or import `@xsyetopz/easel`.

## Agent Rule

Choose one import mode from project evidence. Do not mix npm bare imports, Deno `npm:` specifiers, and Deno `jsr:` specifiers in the same file unless the existing project already does.

## Baseline Package Exports

```json
{
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.es.js",
    "require": "./dist/index.cjs"
  },
  "./src/*": "./src/*"
}
```

## Package Manager Installs

```bash
npm install @xsyetopz/easel@0.5.0
bun add @xsyetopz/easel@0.5.0
pnpm add @xsyetopz/easel@0.5.0
yarn add @xsyetopz/easel@0.5.0
```

## JSR and Deno Adds

```bash
npx jsr add @xsyetopz/easel
bunx jsr add @xsyetopz/easel
deno add npm:@xsyetopz/easel@0.5.0
deno add jsr:@xsyetopz/easel@0.5.0
```

## Browser Bundler ESM

```ts
import * as EASEL from "@xsyetopz/easel";
import { Renderer, Scene, Mesh } from "@xsyetopz/easel";
```

## Deno Import Options

Use `npm:` for Node/npm parity:

```ts
import * as EASEL from "npm:@xsyetopz/easel@0.5.0";
```

Use `jsr:` for JSR-native Deno projects:

```ts
import * as EASEL from "jsr:@xsyetopz/easel@0.5.0";
```

Use an import map alias when the project wants browser-style bare imports:

```json
{
  "imports": {
    "@xsyetopz/easel": "jsr:@xsyetopz/easel@0.5.0"
  }
}
```

Then code can use:

```ts
import * as EASEL from "@xsyetopz/easel";
```

## CommonJS

CommonJS uses the package `require` export:

```js
const EASEL = require("@xsyetopz/easel");
```

## Do Not

- Do not use `createjs` imports; that is CreateJS EaselJS, not this package.
- Do not import source subpaths for app code unless debugging package internals.
- Do not use Deno CLI/headless code as proof that rendering works; rendering still needs a DOM canvas.
