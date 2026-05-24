# THREE.js Migration

EASEL.js mirrors useful THREE.js concepts, but use EASEL.js class names/signatures.

| THREE.js concept      | EASEL.js baseline                         |
| --------------------- | ----------------------------------------- |
| `Scene`               | `Scene`                                   |
| `Object3D`            | `Node`                                    |
| `Group`               | `Group`                                   |
| `Mesh`                | `Mesh`                                    |
| `PerspectiveCamera`   | `PerspectiveCamera`                       |
| `OrthographicCamera`  | `OrthographicCamera`                      |
| `BufferGeometry`      | `Geometry`                                |
| `MeshBasicMaterial`   | `BasicMaterial`                           |
| `MeshLambertMaterial` | `LambertMaterial`                         |
| `Texture`             | `Texture`, `DataTexture`, `CanvasTexture` |
| `WebGLRenderer`       | `Renderer` CPU/Canvas2D renderer          |

Porting recipe:

1. Replace renderer setup with `new EASEL.Renderer({ width, height, canvas })`.
2. Replace `BufferGeometry` attributes with `Geometry.setPositions`, `setNormals`, `setUVs`, `setIndex`.
3. Replace mesh material class names.
4. Remove GPU-specific code and shader/material node code.
5. Confirm camera aspect update and render loop.
