# Materials

Base `Material` fields:

- `layer`: draw order within tile; higher draws later
- `opacity`: discrete translucency, 0 opaque through 8 nearly transparent
- `shading`: `Shading.Flat` or `Shading.Gouraud`
- `side`: `Side.Front`, `Side.Back`, or `Side.Double`
- `visible`
- `needsUpdate`

Material classes:

- `BasicMaterial`: solid or textured, not lit
- `LambertMaterial`: diffuse lighting from scene lights
- `ToonMaterial`: toon-styled material
- `LineMaterial`, `DashedLineMaterial`, `PointsMaterial`

Options common to `BasicMaterial` and `LambertMaterial`:

```ts
{
	color?: EASEL.Color | number | string;
	map?: EASEL.Texture;
	layer?: number;
	opacity?: number;
	shading?: number;
	side?: number;
}
```

Flat textured material:

```ts
const material = new EASEL.BasicMaterial({
	map: atlas,
	side: EASEL.Side.Front,
	shading: EASEL.Shading.Flat,
});
```

Lit material:

```ts
const material = new EASEL.LambertMaterial({ color: 0xffffff, shading: EASEL.Shading.Gouraud });
```

Transparent pass pattern:

```ts
const water = new EASEL.BasicMaterial({ map: atlas, side: EASEL.Side.Front, shading: EASEL.Shading.Flat });
water.opacity = 3;
```
