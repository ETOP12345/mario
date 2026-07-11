export const TILE = 32;
export const GRAVITY = 2200;

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function solidAt(level, x, y, w, h) {
  return level.solids.filter((solid) => rectsOverlap({ x, y, w, h }, solid));
}

export function moveWithCollisions(entity, level, dt) {
  entity.onGround = false;
  entity.x += entity.vx * dt;
  for (const solid of solidAt(level, entity.x, entity.y, entity.w, entity.h)) {
    if (entity.vx > 0) entity.x = solid.x - entity.w;
    if (entity.vx < 0) entity.x = solid.x + solid.w;
    entity.vx = 0;
  }

  entity.y += entity.vy * dt;
  for (const solid of solidAt(level, entity.x, entity.y, entity.w, entity.h)) {
    if (entity.vy > 0) {
      entity.y = solid.y - entity.h;
      entity.onGround = true;
    }
    if (entity.vy < 0) {
      entity.y = solid.y + solid.h;
      entity.hitCeiling = true;
    }
    entity.vy = 0;
  }
}

export function expandTiles(items) {
  return items.map((item) => ({
    ...item,
    x: item.x * TILE,
    y: item.y * TILE,
    w: (item.w ?? 1) * TILE,
    h: (item.h ?? 1) * TILE
  }));
}
