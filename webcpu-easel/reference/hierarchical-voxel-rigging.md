# Hierarchical Voxel Rigging Pattern

Use this pattern for blocky characters or articulated voxel props built from grouped cuboid parts.

Pattern:

- Model root is a `Group`.
- Each joint is a named `Group`.
- Cuboid body parts are manual `Geometry` meshes parented under joints.
- One shared `BasicMaterial` with skin `DataTexture` is reused across parts.
- Animation uses `Animator`, `AnimationClip`, and `Track` names that match joint properties.
- Step animation can be implemented by subclassing `Track.interpolate` when discrete frames are required.

Skeleton recipe:

```ts
const root = new EASEL.Group();
root.name = "Player";
const arm = new EASEL.Group();
arm.name = "RightArm";
root.add(arm);
const animator = new EASEL.Animator(root);
```
