# Pointer Input and Grid Picking Pattern

Use this pattern when DOM pointer events drive camera control, object selection, or voxel tile targeting.

Patterns:

- Pointer down/move/up drives drag state.
- Wheel delta changes orbit distance.
- Keyboard input can rotate orbit cameras or move focus independently from pointer state.
- Click coordinates are scaled from CSS pixels into canvas backing-store pixels.
- Tile picking uses custom DDA raycast through voxel grids when grid cell and face normal are required.

Pointer scaling recipe:

```ts
const rect = canvas.getBoundingClientRect();
const screenX = (event.clientX - rect.left) * (canvas.width / rect.width);
const screenY = (event.clientY - rect.top) * (canvas.height / rect.height);
```

DDA picking is preferred for voxel tile targeting because it returns grid cell and face normal directly.
