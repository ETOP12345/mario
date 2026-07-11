import { GameEngine } from "./engine/GameEngine.js";

const canvas = document.querySelector("#game");
const overlay = document.querySelector("#overlay");
const editorPanel = document.querySelector("#editorPanel");
const levelJson = document.querySelector("#levelJson");

const game = new GameEngine(canvas, {
  onModeChange(mode, title, message) {
    if (mode === "play") {
      overlay.classList.add("hidden");
      return;
    }
    overlay.classList.remove("hidden");
    overlay.innerHTML = `
      <div class="panel">
        <h1>${title}</h1>
        <p>${message}</p>
        <div class="menu-grid">
          <button data-action="start">${mode === "pause" ? "Resume" : "Start Game"}</button>
          <button data-action="continue">Load Save</button>
          <button data-action="editor">Level Editor</button>
          <button data-action="${mode === "settings" ? "start" : "settings"}">${mode === "settings" ? "Back" : "Settings"}</button>
        </div>
      </div>`;
  },
  onEditor(level) {
    levelJson.value = JSON.stringify(level, null, 2);
    editorPanel.classList.remove("hidden");
  }
});

overlay.addEventListener("click", async (event) => {
  const action = event.target?.dataset?.action;
  if (!action) return;
  if (action === "start") await game.startOrResume();
  if (action === "continue") await game.loadSave();
  if (action === "editor") {
    try {
      await game.openEditor();
    } catch (error) {
      showMessage("Editor Error", error?.message ?? "Could not open the level editor.");
    }
  }
  if (action === "settings") game.toggleSettings();
});

editorPanel.addEventListener("click", async (event) => {
  const action = event.target?.dataset?.editor;
  if (!action) return;
  if (action === "close") editorPanel.classList.add("hidden");
  if (action === "load") {
    try {
      await game.loadCustomLevel(JSON.parse(levelJson.value));
      editorPanel.classList.add("hidden");
    } catch (error) {
      showMessage("JSON Error", error?.message ?? "That level JSON could not be loaded.");
    }
  }
  if (action === "download") {
    const blob = new Blob([levelJson.value], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "custom-level.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }
});

function showMessage(title, message) {
  overlay.classList.remove("hidden");
  overlay.innerHTML = `
    <div class="panel">
      <h1>${title}</h1>
      <p>${message}</p>
      <div class="menu-grid">
        <button data-action="start">Play</button>
        <button data-action="editor">Level Editor</button>
      </div>
    </div>`;
}

game.boot().catch((error) => {
  console.error(error);
  showMessage("Load Error", error?.message ?? "The game could not start.");
});
