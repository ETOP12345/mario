export class UI {
  constructor(renderer) {
    this.renderer = renderer;
  }

  draw(game) {
    const ctx = this.renderer.ctx;
    const p = game.player;
    ctx.save();
    ctx.font = "18px Trebuchet MS, Verdana";
    ctx.fillStyle = "#10131caa";
    ctx.fillRect(0, 0, 960, 42);
    ctx.fillStyle = "#fff6ce";
    ctx.fillText(`Score ${p.score}`, 18, 27);
    ctx.fillText(`Coins ${p.coins}`, 150, 27);
    ctx.fillText(`Lives ${p.lives}`, 250, 27);
    ctx.fillText(`Health ${p.health}/${p.maxHealth}`, 350, 27);
    ctx.fillText(`Time ${Math.ceil(game.timer)}`, 520, 27);
    ctx.fillText(`Level ${game.levelIndex + 1}: ${game.level.name}`, 650, 27);
    ctx.restore();
  }
}
