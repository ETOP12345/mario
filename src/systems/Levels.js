import { expandTiles, TILE } from "./Physics.js";
import { Enemy } from "../entities/Enemy.js";

const LEVEL_FILES = ["levels/level1.json", "levels/level2.json", "levels/level3.json"];

export class LevelManager {
  constructor(audio) {
    this.audio = audio;
    this.index = 0;
  }

  async load(index = this.index) {
    this.index = index;
    return this.prepare(await this.loadRaw(index));
  }

  async loadRaw(index = this.index) {
    const response = await fetch(LEVEL_FILES[index], { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load ${LEVEL_FILES[index]}`);
    return response.json();
  }

  prepare(raw) {
    const level = JSON.parse(JSON.stringify(raw));
    level.audio = this.audio;
    level.spawn = { x: level.spawn.x * TILE, y: level.spawn.y * TILE };
    level.width *= TILE;
    level.height *= TILE;
    level.solids = expandTiles(level.solids ?? []);
    level.hiddenSolids = expandTiles(level.hiddenSolids ?? []).map((solid) => ({ ...solid, hidden: true }));
    level.blocks = expandTiles(level.blocks ?? []).map((block) => ({ ...block, used: false }));
    level.movingPlatforms = expandTiles(level.movingPlatforms ?? []).map((platform) => ({ ...platform, baseX: platform.x, baseY: platform.y, phase: 0, vx: 0, vy: 0 }));
    level.hazards = expandTiles(level.hazards ?? []);
    level.coins = expandTiles(level.coins ?? []).map((coin) => ({ ...coin, w: 18, h: 18, x: coin.x + 7, y: coin.y + 7, taken: false }));
    level.powerups = [];
    level.enemies = (level.enemies ?? []).map((enemy) => new Enemy({ ...enemy, x: enemy.x * TILE, y: enemy.y * TILE, left: enemy.left * TILE, right: enemy.right * TILE }));
    level.checkpoints = expandTiles(level.checkpoints ?? []).map((cp) => ({ ...cp, active: false }));
    level.flag = { ...level.flag, x: level.flag.x * TILE, y: level.flag.y * TILE, w: 24, h: 128 };
    if (level.boss) level.enemies.push(new Enemy({ ...level.boss, type: "boss", x: level.boss.x * TILE, y: level.boss.y * TILE, left: level.boss.left * TILE, right: level.boss.right * TILE, w: 56, h: 60 }));
    level.bumpBlocks = (player) => {
      for (const block of level.blocks) {
        const touching = player.x + player.w > block.x && player.x < block.x + block.w && Math.abs(player.y - (block.y + block.h)) < 10;
        if (!touching || block.used) continue;
        if (block.kind === "break" && player.big) {
          block.used = true;
          level.audio.play("break");
          level.particles?.pushBurst(block.x + 16, block.y + 16, "#c06b43");
          level.solids = level.solids.filter((solid) => solid !== block);
        }
        if (block.kind === "question") {
          block.used = true;
          if (block.contains === "coin") {
            player.coins += 1;
            player.score += 100;
            level.audio.play("coin");
          } else {
            level.powerups.push({ type: block.contains, x: block.x + 4, y: block.y - 26, w: 24, h: 24, vx: 50, vy: -120, age: 0, dead: false });
            level.audio.play("power");
          }
        }
      }
    };
    level.solids.push(...level.hiddenSolids, ...level.blocks.filter((block) => !block.used));
    return level;
  }

  hasNext() {
    return this.index < LEVEL_FILES.length - 1;
  }
}
