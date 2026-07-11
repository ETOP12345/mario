export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set();
    this.gamepad = null;
    this.fullscreenRequested = false;

    addEventListener("keydown", (event) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
        event.preventDefault();
      }
      if (!this.keys.has(event.code)) this.pressed.add(event.code);
      this.keys.add(event.code);
    });

    addEventListener("keyup", (event) => {
      this.keys.delete(event.code);
    });

    addEventListener("gamepadconnected", (event) => {
      this.gamepad = event.gamepad.index;
    });

    canvas.addEventListener("click", () => canvas.focus());
    canvas.tabIndex = 0;
  }

  beginFrame() {
    const pads = navigator.getGamepads?.() ?? [];
    this.pad = this.gamepad !== null ? pads[this.gamepad] : pads.find(Boolean);
  }

  endFrame() {
    this.pressed.clear();
  }

  axisX() {
    const keyboard = (this.down("ArrowRight") || this.down("KeyD") ? 1 : 0) - (this.down("ArrowLeft") || this.down("KeyA") ? 1 : 0);
    const pad = Math.abs(this.pad?.axes?.[0] ?? 0) > 0.25 ? Math.sign(this.pad.axes[0]) : 0;
    const dpad = (this.pad?.buttons?.[15]?.pressed ? 1 : 0) - (this.pad?.buttons?.[14]?.pressed ? 1 : 0);
    return keyboard || dpad || pad;
  }

  down(code) {
    return this.keys.has(code);
  }

  justPressed(code) {
    return this.pressed.has(code);
  }

  jumpDown() {
    return this.down("Space") || this.down("ArrowUp") || this.down("KeyW") || this.pad?.buttons?.[0]?.pressed;
  }

  jumpPressed() {
    return this.justPressed("Space") || this.justPressed("ArrowUp") || this.justPressed("KeyW") || this.pad?.buttons?.[0]?.pressed;
  }

  firePressed() {
    return this.justPressed("KeyF") || this.justPressed("KeyJ") || this.pad?.buttons?.[2]?.pressed || this.pad?.buttons?.[7]?.pressed;
  }

  pausePressed() {
    return this.justPressed("Escape") || this.pad?.buttons?.[9]?.pressed;
  }

  fullscreenPressed() {
    return this.justPressed("Enter");
  }
}
