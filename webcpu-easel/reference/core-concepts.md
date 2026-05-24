# Core Concepts

EASEL.js uses a scene graph. `Scene` is the root. Most renderable or container objects extend `Node`.

`Node` public surface includes:

- identity: `id`, `name`, `type`, `userData`
- hierarchy: `parent`, `children`, `add`, `remove`, `traverse`, `traverseVisible`
- transforms: `position`, `rotation`, `quaternion`, `scale`, `lookAt`, `updateMatrix`, `updateMatrixWorld`
- visibility/culling: `visible`, `frustumCulled`, `layers`
- matrices: `matrix`, `matrixWorld`, `autoUpdateMatrix`, `matrixWorldAutoUpdate`, `matrixWorldNeedsUpdate`

Common object graph:

```ts
const scene = new EASEL.Scene();
const root = new EASEL.Group();
const mesh = new EASEL.Mesh(geometry, material);
root.add(mesh);
scene.add(root);
scene.updateMatrixWorld();
```

Transform recipe:

```ts
node.position.set(x, y, z);
node.rotation.y = Math.PI / 4;
node.scale.set(1, 2, 1);
node.updateMatrixWorld();
```

`Scene` adds:

- `autoUpdate: boolean`
- `fog: Fog | undefined`
- `background: Color | number | undefined`

Use `scene.updateMatrixWorld()` before render when mutating transforms manually. The renderer can update scene world matrices when `Scene.autoUpdate` is true, but explicit update keeps examples predictable.
