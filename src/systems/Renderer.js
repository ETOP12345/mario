export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
  }

  clear(theme) {
    const ctx = this.ctx;
    const sky = theme === "castle" ? "#5f6170" : theme === "underground" ? "#191a2a" : "#78c8f4";
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  background(level, camera) {
    const ctx = this.ctx;
    if (level.theme === "underground") {
      ctx.fillStyle = "#252239";
      for (let x = -camera.x * 0.15 % 110; x < this.canvas.width; x += 110) ctx.fillRect(x, 70, 48, 360);
      return;
    }
    ctx.fillStyle = level.theme === "castle" ? "#363946" : "#dff6ff";
    for (let x = -camera.x * 0.18 % 210; x < this.canvas.width; x += 210) {
      ctx.fillRect(x + 30, 72, 72, 20);
      ctx.fillRect(x + 55, 52, 54, 24);
      ctx.fillRect(x + 94, 80, 44, 18);
    }
    ctx.fillStyle = level.theme === "castle" ? "#7b5f62" : "#699f6c";
    for (let x = -camera.x * 0.32 % 260; x < this.canvas.width; x += 260) {
      ctx.beginPath();
      ctx.moveTo(x, 360);
      ctx.lineTo(x + 120, 150);
      ctx.lineTo(x + 245, 360);
      ctx.fill();
    }
    ctx.fillStyle = level.theme === "castle" ? "#454858" : "#2c864f";
    for (let x = -camera.x * 0.55 % 180; x < this.canvas.width; x += 180) {
      ctx.fillRect(x + 80, 300, 18, 80);
      ctx.fillRect(x + 48, 258, 82, 50);
      ctx.fillRect(x + 62, 224, 55, 48);
    }
  }

  world(level, player, camera, projectiles, particles) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(-Math.floor(camera.x), -Math.floor(camera.y));
    for (const solid of level.solids) if (!solid.hidden && !solid.moving) this.tile(solid, level.theme);
    for (const platform of level.movingPlatforms) this.tile(platform, "platform");
    for (const hazard of level.hazards) this.spikes(hazard);
    for (const coin of level.coins) if (!coin.taken) this.coin(coin);
    for (const cp of level.checkpoints) this.checkpoint(cp);
    for (const power of level.powerups) this.power(power);
    for (const enemy of level.enemies) this.enemy(enemy);
    for (const shot of projectiles) this.projectile(shot);
    this.flag(level.flag);
    this.player(player);
    particles.draw(ctx);
    ctx.restore();
  }

  tile(rect, theme) {
    const ctx = this.ctx;
    ctx.fillStyle = rect.kind === "question" ? "#d79832" : rect.kind === "break" ? "#b76745" : theme === "castle" ? "#74707a" : theme === "underground" ? "#554678" : theme === "platform" ? "#9f6a43" : "#6dbb55";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = "#0003";
    ctx.fillRect(rect.x, rect.y + rect.h - 7, rect.w, 7);
    ctx.strokeStyle = "#fff3";
    ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
    if (rect.kind === "question") {
      ctx.fillStyle = rect.used ? "#805f3d" : "#fff3b4";
      ctx.font = "24px Trebuchet MS";
      ctx.fillText("?", rect.x + 9, rect.y + 24);
    }
  }

  spikes(rect) {
    const ctx = this.ctx;
    ctx.fillStyle = "#d9dde8";
    for (let x = rect.x; x < rect.x + rect.w; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, rect.y + rect.h);
      ctx.lineTo(x + 8, rect.y);
      ctx.lineTo(x + 16, rect.y + rect.h);
      ctx.fill();
    }
  }

  player(p) {
    const ctx = this.ctx;
    if (p.hurtTimer > 0 && Math.floor(p.hurtTimer * 18) % 2) return;
    ctx.fillStyle = p.invincible > 0 ? "#fff16a" : "#3d6eea";
    ctx.fillRect(p.x + 3, p.y + 8, p.w - 6, p.h - 8);
    ctx.fillStyle = "#f6b46b";
    ctx.fillRect(p.x + 5, p.y, p.w - 10, 13);
    ctx.fillStyle = p.fire ? "#ff6138" : "#2843a8";
    ctx.fillRect(p.x + 2, p.y - 4, p.w - 4, 7);
    ctx.fillStyle = "#151722";
    ctx.fillRect(p.x + (p.facing > 0 ? 15 : 7), p.y + 5, 3, 3);
  }

  enemy(e) {
    const ctx = this.ctx;
    if (e.deathTimer > 0.5) return;
    ctx.fillStyle = e.type === "boss" ? "#843f8f" : e.type === "flying" ? "#d85c75" : "#8b5836";
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.fillStyle = "#fff";
    ctx.fillRect(e.x + 6, e.y + 7, 5, 5);
    ctx.fillRect(e.x + e.w - 11, e.y + 7, 5, 5);
    ctx.fillStyle = "#111";
    ctx.fillRect(e.x + 8, e.y + 9, 2, 2);
    ctx.fillRect(e.x + e.w - 9, e.y + 9, 2, 2);
    if (e.type === "flying") {
      ctx.fillStyle = "#ffd3df";
      ctx.fillRect(e.x - 12, e.y + 8, 12, 8);
      ctx.fillRect(e.x + e.w, e.y + 8, 12, 8);
    }
    if (e.type === "boss") {
      ctx.fillStyle = "#111";
      ctx.fillRect(e.x + 8, e.y - 8, e.w - 16, 8);
      ctx.fillStyle = "#e24646";
      ctx.fillRect(e.x + 8, e.y - 8, (e.w - 16) * Math.max(0, e.health / e.maxHealth), 8);
    }
  }

  coin(c) {
    const ctx = this.ctx;
    ctx.fillStyle = "#ffdf4d";
    ctx.fillRect(c.x + 4, c.y, 10, 18);
    ctx.fillStyle = "#fff4a5";
    ctx.fillRect(c.x + 7, c.y + 3, 3, 10);
  }

  power(p) {
    const ctx = this.ctx;
    const colors = { grow: "#58cf69", star: "#fff16a", fire: "#ff6138", life: "#ff76aa", speed: "#55e4f0" };
    ctx.fillStyle = colors[p.type] ?? "#fff";
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = "#1118";
    ctx.fillRect(p.x + 6, p.y + 6, p.w - 12, p.h - 12);
  }

  projectile(s) {
    this.ctx.fillStyle = s.hostile ? "#9ef" : "#ff7a35";
    this.ctx.fillRect(s.x, s.y, s.w, s.h);
  }

  checkpoint(cp) {
    const ctx = this.ctx;
    ctx.fillStyle = cp.active ? "#6dff93" : "#f9f2cf";
    ctx.fillRect(cp.x + 13, cp.y - 48, 5, 80);
    ctx.fillRect(cp.x + 18, cp.y - 46, 32, 22);
  }

  flag(flag) {
    const ctx = this.ctx;
    ctx.fillStyle = "#f2e9d0";
    ctx.fillRect(flag.x, flag.y, 5, flag.h);
    ctx.fillStyle = "#ff526d";
    ctx.fillRect(flag.x + 5, flag.y + 6, 42, 26);
  }
}
