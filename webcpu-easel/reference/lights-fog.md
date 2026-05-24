# Lights and Fog

Light exports:

- `AmbientLight`
- `DirectionalLight`
- `HemisphereLight`
- `PointLight`
- `SpotLight`
- helpers: `DirectionalLightHelper`, `PointLightHelper`, `SpotLightHelper`

Use lights with lit materials such as `LambertMaterial`. `BasicMaterial` is unlit.

Scene lighting recipe:

```ts
scene.add(new EASEL.AmbientLight(0xffffff, 0.35));
const sun = new EASEL.DirectionalLight(0xffffff, 0.8);
sun.position.set(1, 2, 1);
scene.add(sun);
```

Fog constructor:

```ts
new EASEL.Fog({ color?: EASEL.Color | number | string, near?: number, far?: number, density?: number })
```

Fog recipe:

```ts
scene.fog = new EASEL.Fog({ color: 0x000000, near: 12, far: 48, density: 2.5 });
scene.background = 0x000000;
```

Fog is applied during render pipeline culling/blending. Tune `near`, `far`, and `density` for scene scale.
