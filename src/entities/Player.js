import { GRAVITY, moveWithCollisions, rectsOverlap } from "../systems/Physics.js";

export class Player {
  constructor(spawn) {
    this.reset(spawn);
  }

  reset(spawn) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.w = 24;
    this.h = 30;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.onGround = false;
    this.jumpHeld = false;
    this.health = 3;
    this.maxHealth = 3;
    this.lives = 3;
    this.coins = 0;
    this.score = 0;
    this.checkpoint = { ...spawn };
    this.big = false;
    this.fire = false;
    this.invincible = 0;
    this.speedBoost = 0;
    this.hurtTimer = 0;
    this.fireCooldown = 0;
  }

  update(dt, input, level, emitFireball) {
    const move = input.axisX();
    const maxSpeed = this.speedBoost > 0 ? 310 : 225;
    const accel = this.onGround ? 1800 : 1050;
    const friction = this.onGround ? 1550 : 380;
    if (move) {
      this.vx += move * accel * dt;
      this.facing = move;
    } else {
      const drag = Math.sign(this.vx) * friction * dt;
      this.vx = Math.abs(drag) > Math.abs(this.vx) ? 0 : this.vx - drag;
    }
    this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx));

    if (input.jumpPressed() && this.onGround) {
      this.vy = -650;
      this.jumpHeld = true;
      level.audio.play("jump");
    }
    if (!input.jumpDown() && this.vy < -180) this.vy = -180;

    this.vy += GRAVITY * dt;
    this.hitCeiling = false;
    moveWithCollisions(this, level, dt);

    if (this.hitCeiling) level.bumpBlocks(this);
    if (this.fire && input.firePressed() && this.fireCooldown <= 0) {
      emitFireball(this.x + this.w / 2, this.y + 12, this.facing);
      this.fireCooldown = 0.28;
    }

    this.invincible = Math.max(0, this.invincible - dt);
    this.speedBoost = Math.max(0, this.speedBoost - dt);
    this.hurtTimer = Math.max(0, this.hurtTimer - dt);
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
  }

  hurt(amount = 1) {
    if (this.invincible > 0 || this.hurtTimer > 0) return false;
    this.health -= amount;
    this.hurtTimer = 1.2;
    this.vy = -340;
    return this.health <= 0;
  }

  applyPower(type) {
    if (type === "grow") {
      this.big = true;
      this.maxHealth = 5;
      this.health = Math.min(this.maxHealth, this.health + 2);
      this.h = 42;
    }
    if (type === "star") this.invincible = 8;
    if (type === "fire") this.fire = true;
    if (type === "life") this.lives += 1;
    if (type === "speed") this.speedBoost = 8;
  }

  overlaps(item) {
    return rectsOverlap(this, item);
  }
}
