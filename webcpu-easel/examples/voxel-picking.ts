import type * as EASEL from "@xsyetopz/easel";

export interface TileHit {
	tileX: number;
	tileY: number;
	tileZ: number;
	faceNx: number;
	faceNy: number;
	faceNz: number;
}

export interface VoxelWorld {
	camera?: EASEL.PerspectiveCamera;
	getBlock(x: number, y: number, z: number): number;
}

interface GridCursor {
	ix: number;
	iy: number;
	iz: number;
}

interface StepDirection {
	x: number;
	y: number;
	z: number;
}

interface RayTiming {
	deltaX: number;
	deltaY: number;
	deltaZ: number;
	maxX: number;
	maxY: number;
	maxZ: number;
	distance: number;
}

interface FaceNormal {
	x: number;
	y: number;
	z: number;
}

export function raycastVoxels(
	ox: number,
	oy: number,
	oz: number,
	dx: number,
	dy: number,
	dz: number,
	world: VoxelWorld,
	maxDistance = 64,
): TileHit | undefined {
	const cursor = createGridCursor(ox, oy, oz);
	const step = createStepDirection(dx, dy, dz);
	const timing = createRayTiming(cursor, ox, oy, oz, dx, dy, dz);
	const normal = { x: 0, y: 0, z: 0 };
	while (timing.distance < maxDistance) {
		if (world.getBlock(cursor.ix, cursor.iy, cursor.iz) !== 0) {
			return createTileHit(cursor, normal);
		}
		advanceRay(cursor, step, timing, normal);
	}
	return undefined;
}

function createGridCursor(ox: number, oy: number, oz: number): GridCursor {
	return { ix: Math.floor(ox), iy: Math.floor(oy), iz: Math.floor(oz) };
}

function createStepDirection(
	dx: number,
	dy: number,
	dz: number,
): StepDirection {
	return { x: Math.sign(dx), y: Math.sign(dy), z: Math.sign(dz) };
}

function createRayTiming(
	cursor: GridCursor,
	ox: number,
	oy: number,
	oz: number,
	dx: number,
	dy: number,
	dz: number,
): RayTiming {
	return {
		deltaX: axisDelta(dx),
		deltaY: axisDelta(dy),
		deltaZ: axisDelta(dz),
		maxX: axisMax(cursor.ix, ox, dx),
		maxY: axisMax(cursor.iy, oy, dy),
		maxZ: axisMax(cursor.iz, oz, dz),
		distance: 0,
	};
}

function axisDelta(direction: number): number {
	return direction === 0 ? Number.POSITIVE_INFINITY : Math.abs(1 / direction);
}

function axisMax(cell: number, origin: number, direction: number): number {
	if (direction > 0) return (cell + 1 - origin) / direction;
	if (direction < 0) return (origin - cell) / -direction;
	return Number.POSITIVE_INFINITY;
}

function advanceRay(
	cursor: GridCursor,
	step: StepDirection,
	timing: RayTiming,
	normal: FaceNormal,
): void {
	if (timing.maxX < timing.maxY && timing.maxX < timing.maxZ) {
		advanceX(cursor, step, timing, normal);
	} else if (timing.maxY < timing.maxZ) {
		advanceY(cursor, step, timing, normal);
	} else {
		advanceZ(cursor, step, timing, normal);
	}
}

function advanceX(
	cursor: GridCursor,
	step: StepDirection,
	timing: RayTiming,
	normal: FaceNormal,
): void {
	timing.distance = timing.maxX;
	cursor.ix += step.x;
	timing.maxX += timing.deltaX;
	setNormal(normal, step.x, 0, 0);
}

function advanceY(
	cursor: GridCursor,
	step: StepDirection,
	timing: RayTiming,
	normal: FaceNormal,
): void {
	timing.distance = timing.maxY;
	cursor.iy += step.y;
	timing.maxY += timing.deltaY;
	setNormal(normal, 0, step.y, 0);
}

function advanceZ(
	cursor: GridCursor,
	step: StepDirection,
	timing: RayTiming,
	normal: FaceNormal,
): void {
	timing.distance = timing.maxZ;
	cursor.iz += step.z;
	timing.maxZ += timing.deltaZ;
	setNormal(normal, 0, 0, step.z);
}

function setNormal(normal: FaceNormal, x: number, y: number, z: number): void {
	normal.x = x;
	normal.y = y;
	normal.z = z;
}

function createTileHit(cursor: GridCursor, normal: FaceNormal): TileHit {
	return {
		tileX: cursor.ix,
		tileY: cursor.iy,
		tileZ: cursor.iz,
		faceNx: -normal.x,
		faceNy: -normal.y,
		faceNz: -normal.z,
	};
}
