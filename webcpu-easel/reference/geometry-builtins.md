# Built-in Geometry

Built-in geometry exports in `@xsyetopz/easel@0.5.0`:

- `BoxGeometry`
- `CapsuleGeometry`
- `ConeGeometry`
- `CylinderGeometry`
- `DodecahedronGeometry`
- `EdgesGeometry`
- `ExtrudeGeometry`
- `IcosahedronGeometry`
- `LatheGeometry`
- `OctahedronGeometry`
- `PlaneGeometry`
- `PolyhedronGeometry`
- `RingGeometry`
- `ShapeGeometry`
- `SphereGeometry`
- `TetrahedronGeometry`
- `TorusGeometry`
- `TorusKnotGeometry`
- `TubeGeometry`
- `WireframeGeometry`

Simple mesh:

```ts
const geometry = new EASEL.BoxGeometry(1, 1, 1);
const material = new EASEL.LambertMaterial({ color: 0xff8844 });
const mesh = new EASEL.Mesh(geometry, material);
scene.add(mesh);
```

When constructor parameters are needed, inspect the corresponding `.d.ts` file under `dist/geometry/primitives/`.
