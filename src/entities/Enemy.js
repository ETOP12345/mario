import { GRAVITY, moveWithCollisions, rectsOverlap } from "../systems/Physics.js";

export class Enemy {
  constructor(data) {
    Object.assign(this, data);
    this.w = data.w ?? 28;
    this.h = data.h ?? 28;
    this.baseY = this.y;
    this.vx = data.speed ?? 55;
    this.vy = 0;
    this.health = data.health ?? (data.type === "boss" ? 12 : 1);
    this.maxHealth = this.health;
    this.left = data.left ?? this.x - 96;
    this.right = data.right ?? this.x + 96;
    this.dead = false;
    this.deathTimer = 0;
    this.phase = 0;
    this.shootTimer = 1.5;
  }

  update(dt, level, player, spawnProjectile) {
    if (this.dead) {
      this.deathTimer += dt;
      this.y -= 30 * dt;
      return;
    }
    this.phase += dt;

    if (this.type === "flying") {
      this.x += this.vx * dt;
      this.y = this.baseY + Math.sin(this.phase * 3) * 32;
      if (this.x < this.left || this.x > this.right) this.vx *= -1;
      return;
    }

    if (this.type === "boss") {
      const direction = Math.sign(player.x - this.x) || 1;
      if (Math.abs(player.x - this.x) < 420) this.vx += direction * 520 * dt;
      this.vx = Math.max(-115, Math.min(115, this.vx));
      this.shootTimer -= dt;
      if (this.shootTimer <= 0) {
        this.shootTimer = this.health < this.maxHealth / 2 ? 0.85 : 1.35;
        spawnProjectile({ x: this.x + this.w / 2, y: this.y + 18, vx: direction * 260, vy: -70, hostile: true });
      }
    }

    if (this.type === "walker" || this.type === "patrol" || this.type === "boss") {
      this.vy += GRAVITY * dt;
      if (this.x < this.left) this.vx = Math.abs(this.vx);
      if (this.x > this.right) this.vx = -Math.abs(this.vx);
      moveWithCollisions(this, level, dt);
      if (this.vx === 0) this.vx = this.speed ? -this.speed : -55;
    }
  }

  hit(amount = 1) {
    this.health -= amount;
    if (this.health <= 0) {
      this.dead = true;
      this.deathTimer = 0;
      this.vx = 0;
    }
  }

  touches(entity) {
    return !this.dead && rectsOverlap(this, entity);
  }
}
