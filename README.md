# Starcap Runner

An original HTML5 side-scrolling platformer inspired by classic platform games without using copyrighted characters, artwork, level layouts, or sounds.

## Play

GitHub Pages URL:

https://etop12345.github.io/mario/

## Run Locally

```bash
npm run dev
```

Open `http://localhost:5180`.

No package install is required. The script uses the small included Node static server so ES modules and JSON level files load correctly.

## Controls

- Move: `A/D` or arrow keys
- Jump: `Space`, `W`, or up arrow
- Fire: `F` or `J`
- Pause: `Escape`
- Fullscreen: `Enter`
- Gamepad: left stick / d-pad, south button jump, west/right trigger fire, start pause

## Features

- Smooth acceleration, gravity, variable-height jumping, wall/platform collision
- Camera follow with parallax backgrounds
- Lives, score, coins, timer, health, checkpoints, local save/load
- Three handcrafted levels: sky-grove, underground, and castle
- Hidden areas, moving platforms, breakable blocks, question blocks, spikes, pits, checkpoints, flags
- Walking, flying, patrol, and boss enemies with stomp/projectile combat
- Growth, invincibility, fireball, extra-life, and speed power-ups
- Procedural pixel-art rendering, particles, and WebAudio music/sounds
- Pause, settings, game over, victory, and built-in JSON level editor

## Project Structure

```text
index.html
package.json
README.md
server.js
assets/
  README.md
levels/
  level1.json
  level2.json
  level3.json
src/
  main.js
  styles.css
  engine/GameEngine.js
  entities/Player.js
  entities/Enemy.js
  entities/PowerUp.js
  systems/Audio.js
  systems/Input.js
  systems/Levels.js
  systems/Physics.js
  systems/Renderer.js
  systems/UI.js
```

## Level Editing

Levels are JSON files in `levels/`. Use the in-game editor to inspect, edit, load, and download level JSON. The schema is intentionally simple: arrays of rectangles for terrain, coins, enemies, blocks, hazards, moving platforms, checkpoints, and a single flag/boss.

TMX support can be added by mapping tile object layers into the same JSON schema; this game already isolates loading in `src/systems/Levels.js` for that purpose.
