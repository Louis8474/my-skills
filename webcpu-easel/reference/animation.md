# Animation

Animation exports:

- `AnimationClip`
- `Animator`
- `Track`
- `BooleanTrack`, `ColorTrack`, `NumberTrack`, `QuaternionTrack`, `VectorTrack`
- `AnimationAction`
- `LoopOnce`, `LoopPingPong`, `LoopRepeat`

Clip recipe:

```ts
const track = new EASEL.Track(
	"Cube.rotation.y",
	new Float32Array([0, 1]),
	new Float32Array([0, Math.PI * 2]),
	1,
);
const clip = new EASEL.AnimationClip("spin", 1, [track]);
const animator = new EASEL.Animator(scene);
animator.clipAction(clip).setLoop(EASEL.LoopRepeat, Infinity).play();
```

Frame update:

```ts
animator.update(dt);
```

Step interpolation pattern:

```ts
class StepTrack extends EASEL.Track {
	override interpolate(index: number): number[] {
		const offset = index * this.itemSize;
		return Array.from(this.values.subarray(offset, offset + this.itemSize));
	}
}
```

Track names resolve node paths and properties. Name scene nodes explicitly before binding animation tracks.
