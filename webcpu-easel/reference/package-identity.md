# Package Identity

This skill covers `@xsyetopz/easel`, also called EASEL.js in the project docs.

Package identity:

- npm/JSR name: `@xsyetopz/easel`
- Runtime target: browser Canvas2D
- Rendering model: CPU software rasterizer
- Scene API style: THREE.js-like scene graph
- Baseline version in this skill: `0.5.0`

Capability boundary framing:

| If the task says...               | Ground to...                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------- |
| “EASEL.js”                        | `@xsyetopz/easel` package unless the repo imports something else                |
| “easeljs.org”                     | This package’s docs/site                                                        |
| “EaselJS” with `createjs` imports | Different library family; inspect actual package/imports before mixing patterns |
| “CPU/WebCPU/Canvas 3D”            | `Renderer` + software rasterizer + Canvas2D upload                              |
| “like THREE.js”                   | Use concept mapping, then confirm class names/signatures in API docs            |

Preferred import style:

```ts
import * as EASEL from "@xsyetopz/easel";
```

Named imports are also valid when the symbol appears in `api-index.md`:

```ts
import { Renderer, Scene, PerspectiveCamera } from "@xsyetopz/easel";
```
