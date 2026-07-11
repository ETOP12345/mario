export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.musicGain = null;
    this.musicTimer = 0;
    this.theme = "overworld";
  }

  ensure() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.045;
    this.musicGain.connect(this.ctx.destination);
  }

  play(name) {
    if (!this.enabled) return;
    this.ensure();
    const specs = {
      jump: [420, 0.08, "square"],
      coin: [880, 0.08, "sine"],
      stomp: [180, 0.12, "sawtooth"],
      power: [660, 0.18, "triangle"],
      hurt: [90, 0.18, "sawtooth"],
      victory: [760, 0.4, "triangle"],
      gameover: [80, 0.6, "sine"],
      fire: [520, 0.07, "square"],
      break: [130, 0.08, "sawtooth"]
    };
    const [freq, dur, type] = specs[name] ?? specs.coin;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq * 0.55), this.ctx.currentTime + dur);
    gain.gain.setValueAtTime(0.14, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + dur);
  }

  update(dt, levelTheme = "overworld") {
    if (!this.enabled || !this.ctx) return;
    this.theme = levelTheme;
    this.musicTimer -= dt;
    if (this.musicTimer > 0) return;
    this.musicTimer = 0.24;
    const songs = {
      overworld: [262, 330, 392, 523, 392, 330],
      underground: [131, 165, 196, 165, 147, 131],
      castle: [196, 185, 174, 165, 147, 131]
    };
    const notes = songs[this.theme] ?? songs.overworld;
    this.noteIndex = ((this.noteIndex ?? 0) + 1) % notes.length;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.value = notes[this.noteIndex];
    gain.gain.value = 0.035;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
    osc.connect(gain).connect(this.musicGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }
}
