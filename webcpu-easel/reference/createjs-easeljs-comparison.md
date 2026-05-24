# CreateJS EaselJS Comparison

This skill targets `@xsyetopz/easel`, not CreateJS EaselJS. Use capability comparison to choose patterns.

| Capability     | `@xsyetopz/easel`                         | CreateJS EaselJS pattern             |
| -------------- | ----------------------------------------- | ------------------------------------ |
| Package import | `@xsyetopz/easel`                         | often `createjs`/`@createjs/easeljs` |
| Renderer       | `Renderer` CPU 3D rasterizer              | `Stage` 2D display list              |
| Scene root     | `Scene`                                   | `Stage`                              |
| Containers     | `Group`/`Node`                            | `Container`                          |
| Shapes         | triangulated `Geometry` + `Mesh`          | `Shape.graphics` drawing commands    |
| Animation      | `Animator`/`AnimationClip`/`Track`        | `Ticker`/tweens                      |
| Camera         | `PerspectiveCamera`, `OrthographicCamera` | not a core 3D camera concept         |

When a project imports `@xsyetopz/easel`, use this skill’s scene/camera/geometry recipes. When a project imports `createjs`, inspect that project separately.
