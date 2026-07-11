export class PowerUp {
  constructor(data) {
    Object.assign(this, data);
    this.w = data.w ?? 24;
    this.h = data.h ?? 24;
    this.vx = this.type === "life" ? 70 : 45;
    this.vy = -120;
    this.age = 0;
    this.dead = false;
  }

  update(dt, level) {
    this.age += dt;
    this.vy += 1600 * dt;
    this.x += this.vx * dt;
    for (const solid of level.solids) {
      if (this.x < solid.x + solid.w && this.x + this.w > solid.x && this.y < solid.y + solid.h && this.y + this.h > solid.y) {
        if (this.vx > 0) this.x = solid.x - this.w;
        else this.x = solid.x + solid.w;
        this.vx *= -1;
      }
    }
    this.y += this.vy * dt;
    for (const solid of level.solids) {
      if (this.x < solid.x + solid.w && this.x + this.w > solid.x && this.y < solid.y + solid.h && this.y + this.h > solid.y) {
        if (this.vy > 0) this.y = solid.y - this.h;
        this.vy = 0;
      }
    }
  }
}
