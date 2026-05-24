# WebGL/WebGPU Comparison

Backend capability matrix:

| Capability            | EASEL.js baseline                                                                |
| --------------------- | -------------------------------------------------------------------------------- |
| GPU device            | not part of public renderer setup                                                |
| WebGL context         | not needed for `Renderer`                                                        |
| WebGPU adapter/device | not needed for `Renderer`                                                        |
| Shader strings        | not the material model in this package                                           |
| Canvas target         | Canvas2D upload from CPU framebuffer                                             |
| Materials             | CPU rasterizer materials like `BasicMaterial`, `LambertMaterial`, `ToonMaterial` |
| Profiling             | `RenderTimings` fields, browser performance tools                                |

For shader or GPU compute requests, either choose a different library/skill or implement a CPU-side visual effect using geometry/material/texture updates.
