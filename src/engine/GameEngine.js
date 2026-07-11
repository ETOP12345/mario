import { Player } from "../entities/Player.js";
import { PowerUp } from "../entities/PowerUp.js";
import { AudioSystem } from "../systems/Audio.js";
import { Input } from "../systems/Input.js";
import { LevelManager } from "../systems/Levels.js";
import { Renderer } from "../systems/Renderer.js";
import { UI } from "../systems/UI.js";
import { rectsOverlap } from "../systems/Physics.js";

class ParticleSystem {
  constructor() {
    this.items = [];
  }
  pushBurst(x, y, color = "#fff") {
    for (let i = 0; i < 14; i += 1) this.items.push({ x, y, vx: (Math.random() - 0.5) * 260, vy: (Math.random() - 0.8) * 260, life: 0.7, color });
  }
  update(dt) {
    for (const p of this.items) {
      p.life -= dt;
      p.vy += 900 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.items = this.items.filter((p) => p.life > 0);
  }
  draw(ctx) {
    for (const p of this.items) {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 4, 4);
    }
  }
}

export class GameEngine {
  constructor(canvas, hooks) {
    this.canvas = canvas;
    this.hooks = hooks;
    this.input = new Input(canvas);
    this.audio = new AudioSystem();
    this.levels = new LevelManager(this.audio);
    this.renderer = new Renderer(canvas);
    this.ui = new UI(this.renderer);
    this.camera = { x: 0, y: 0 };
    this.mode = "menu";
    this.levelIndex = 0;
    this.projectiles = [];
    this.particles = new ParticleSystem();
    this.timer = 300;
    this.settingsOpen = false;
    this.transitioning = false;
    this.last = performance.now();
  }

  async boot() {
    this.level = await this.levels.load(0);
    this.player = new Player(this.level.spawn);
    this.level.particles = this.particles;
    this.loop(this.last);
  }

  async startOrResume() {
    this.audio.ensure();
    if (this.mode === "menu" || this.mode === "gameover" || this.mode === "victory") {
      await this.newGame();
    }
    this.setMode("play");
  }

  async newGame() {
    this.levelIndex = 0;
    this.level = await this.levels.load(0);
    this.level.particles = this.particles;
    this.player = new Player(this.level.spawn);
    this.timer = this.level.time ?? 300;
    this.projectiles = [];
  }

  async loadSave() {
    const save = JSON.parse(localStorage.getItem("starcap-save") ?? "null");
    if (!save) return this.startOrResume();
    this.levelIndex = save.levelIndex ?? 0;
    this.level = await this.levels.load(this.levelIndex);
    this.level.particles = this.particles;
    this.player = new Player(this.level.spawn);
    Object.assign(this.player, save.player);
    this.timer = save.timer ?? this.level.time;
    this.setMode("play");
  }

  save() {
    localStorage.setItem("starcap-save", JSON.stringify({
      levelIndex: this.levelIndex,
      timer: this.timer,
      player: {
        x: this.player.x,
        y: this.player.y,
        lives: this.player.lives,
        health: this.player.health,
        maxHealth: this.player.maxHealth,
        coins: this.player.coins,
        score: this.player.score,
        checkpoint: this.player.checkpoint,
        big: this.player.big,
        fire: this.player.fire
      }
    }));
  }

  setMode(mode) {
    this.mode = mode;
    if (mode === "play" || mode === "pause") this.settingsOpen = false;
    const copy = {
      menu: ["Starcap Runner", "Original pixel platforming adventure."],
      pause: ["Paused", "Take a breather, then hop back in."],
      gameover: ["Game Over", "Your save remains available from the menu."],
      victory: ["Victory", "The fortress flag is yours."]
    };
    if (mode !== "play") this.hooks.onModeChange(mode, copy[mode]?.[0] ?? "Starcap Runner", copy[mode]?.[1] ?? "");
    else this.hooks.onModeChange("play");
  }

  async openEditor() {
    const rawLevel = await this.levels.loadRaw(this.levelIndex);
    this.hooks.onEditor(rawLevel);
  }

  async loadCustomLevel(json) {
    this.levelIndex = 0;
    this.level = this.levels.prepare(json);
    this.level.particles = this.particles;
    this.player = new Player(this.level.spawn);
    this.timer = this.level.time ?? 300;
    this.setMode("play");
  }

  toggleSettings() {
    this.hooks.onModeChange("settings", "Settings", "Sound: On (press M). Enter toggles fullscreen. Esc pauses during play.");
  }

  loop(now) {
    const dt = Math.min(1 / 30, (now - this.last) / 1000);
    this.last = now;
    this.input.beginFrame();
    if (this.mode === "play") this.update(dt);
    this.render();
    this.input.endFrame();
    requestAnimationFrame((time) => this.loop(time));
  }

  update(dt) {
    if (this.input.pausePressed()) {
      this.save();
      this.setMode("pause");
      return;
    }
    if (this.input.fullscreenPressed()) this.canvas.requestFullscreen?.();
    if (this.input.justPressed("KeyM")) this.audio.enabled = !this.audio.enabled;

    this.timer -= dt;
    if (this.timer <= 0) this.killPlayer();

    this.updateMovingPlatforms(dt);
    this.player.update(dt, this.input, this.level, (x, y, facing) => this.spawnFireball(x, y, facing));
    this.collectItems();
    this.updateEnemies(dt);
    this.updatePowerups(dt);
    this.updateProjectiles(dt);
    this.checkHazards();
    this.checkFlag();
    this.particles.update(dt);
    this.audio.update(dt, this.level.theme);
    this.camera.x += ((this.player.x - 380) - this.camera.x) * Math.min(1, dt * 6);
    this.camera.x = Math.max(0, Math.min(this.level.width - this.canvas.width, this.camera.x));
    this.camera.y = Math.max(0, Math.min(this.level.height - this.canvas.height, this.player.y - 310));
    if (this.player.y > this.level.height + 160) this.killPlayer();
  }

  updateMovingPlatforms(dt) {
    for (const platform of this.level.movingPlatforms) {
      const oldX = platform.x;
      const oldY = platform.y;
      platform.phase += dt;
      platform.x = platform.baseX + Math.sin(platform.phase * (platform.speed ?? 1)) * (platform.rangeX ?? 0);
      platform.y = platform.baseY + Math.sin(platform.phase * (platform.speed ?? 1.2)) * (platform.rangeY ?? 0);
      platform.vx = (platform.x - oldX) / dt;
      platform.vy = (platform.y - oldY) / dt;
      if (rectsOverlap(this.player, { ...platform, y: platform.y - 2, h: 4 }) && this.player.vy >= 0) {
        this.player.y = platform.y - this.player.h;
        this.player.x += platform.vx * dt;
        this.player.onGround = true;
      }
    }
    this.level.solids = this.level.solids.filter((s) => !s.moving);
    this.level.solids.push(...this.level.movingPlatforms.map((p) => ({ ...p, moving: true })));
  }

  collectItems() {
    for (const coin of this.level.coins) {
      if (!coin.taken && this.player.overlaps(coin)) {
        coin.taken = true;
        this.player.coins += 1;
        this.player.score += 100;
        this.audio.play("coin");
        this.particles.pushBurst(coin.x + 8, coin.y + 8, "#ffdf4d");
        if (this.player.coins % 50 === 0) this.player.lives += 1;
      }
    }
    for (const cp of this.level.checkpoints) {
      if (!cp.active && this.player.overlaps(cp)) {
        cp.active = true;
        this.player.checkpoint = { x: cp.x, y: cp.y - this.player.h };
        this.save();
        this.audio.play("power");
      }
    }
  }

  updateEnemies(dt) {
    for (const enemy of this.level.enemies) {
      enemy.update(dt, this.level, this.player, (shot) => this.projectiles.push({ ...shot, w: 14, h: 14, life: 4 }));
      if (enemy.dead && enemy.deathTimer > 0.7) continue;
      if (!enemy.dead && enemy.touches(this.player)) {
        const stomp = this.player.vy > 60 && this.player.y + this.player.h - enemy.y < 18;
        if (stomp || this.player.invincible > 0) {
          enemy.hit(this.player.invincible > 0 ? 5 : 1);
          this.player.vy = -430;
          this.player.score += enemy.type === "boss" ? 1000 : 200;
          this.audio.play("stomp");
          this.particles.pushBurst(enemy.x + enemy.w / 2, enemy.y, "#f8f3d8");
        } else if (this.player.hurt(enemy.type === "boss" ? 2 : 1)) {
          this.killPlayer();
        } else {
          this.audio.play("hurt");
        }
      }
    }
    this.level.enemies = this.level.enemies.filter((e) => !e.dead || e.deathTimer < 0.75);
  }

  updatePowerups(dt) {
    for (let i = 0; i < this.level.powerups.length; i += 1) {
      const raw = this.level.powerups[i];
      const power = raw.update ? raw : new PowerUp(raw);
      this.level.powerups[i] = power;
      power.update(dt, this.level);
      if (this.player.overlaps(power)) {
        this.player.applyPower(power.type);
        this.player.score += 250;
        power.dead = true;
        this.audio.play("power");
      }
    }
    this.level.powerups = this.level.powerups.filter((p) => !p.dead);
  }

  spawnFireball(x, y, facing) {
    this.projectiles.push({ x, y, w: 12, h: 12, vx: facing * 430, vy: -40, life: 1.8, hostile: false });
    this.audio.play("fire");
  }

  updateProjectiles(dt) {
    for (const shot of this.projectiles) {
      shot.life -= dt;
      shot.vy += 900 * dt;
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      for (const solid of this.level.solids) {
        if (rectsOverlap(shot, solid)) shot.life = 0;
      }
      if (shot.hostile) {
        if (this.player.overlaps(shot)) {
          shot.life = 0;
          if (this.player.hurt(1)) this.killPlayer();
          else this.audio.play("hurt");
        }
      } else {
        for (const enemy of this.level.enemies) {
          if (!enemy.dead && rectsOverlap(shot, enemy)) {
            enemy.hit(1);
            shot.life = 0;
            this.player.score += 150;
            this.audio.play("stomp");
          }
        }
      }
    }
    this.projectiles = this.projectiles.filter((shot) => shot.life > 0);
  }

  checkHazards() {
    if (this.level.hazards.some((hazard) => this.player.overlaps(hazard))) {
      if (this.player.hurt(1)) this.killPlayer();
      else this.audio.play("hurt");
    }
  }

  async checkFlag() {
    if (this.transitioning || !this.player.overlaps(this.level.flag)) return;
    this.transitioning = true;
    this.player.score += Math.ceil(this.timer) * 10;
    this.audio.play("victory");
    if (this.levels.hasNext()) {
      this.levelIndex += 1;
      this.level = await this.levels.load(this.levelIndex);
      this.level.particles = this.particles;
      const stats = { lives: this.player.lives, coins: this.player.coins, score: this.player.score, big: this.player.big, fire: this.player.fire, maxHealth: this.player.maxHealth };
      this.player = new Player(this.level.spawn);
      Object.assign(this.player, stats);
      this.timer = this.level.time ?? 300;
      this.save();
      this.transitioning = false;
    } else {
      this.save();
      this.setMode("victory");
    }
  }

  killPlayer() {
    this.audio.play(this.player.lives <= 1 ? "gameover" : "hurt");
    this.player.lives -= 1;
    if (this.player.lives < 0) {
      this.setMode("gameover");
      return;
    }
    const stats = { lives: this.player.lives, coins: this.player.coins, score: this.player.score };
    this.player = new Player(this.player.checkpoint ?? this.level.spawn);
    Object.assign(this.player, stats);
    this.timer = Math.max(60, this.timer);
  }

  render() {
    this.renderer.clear(this.level?.theme);
    if (this.level) {
      this.renderer.background(this.level, this.camera);
      this.renderer.world(this.level, this.player, this.camera, this.projectiles, this.particles);
      this.ui.draw(this);
    }
  }
}
