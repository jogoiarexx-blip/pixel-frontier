import { Engine } from "@babylonjs/core/Engines/engine.js";
import { createGameScene } from "./game/scene.js";

const canvas = document.getElementById("game-canvas");
const boot = document.getElementById("boot-screen");
const bootStatus = document.getElementById("boot-status");
const bootProgress = document.getElementById("boot-progress");
const errorScreen = document.getElementById("error-screen");
const errorMessage = document.getElementById("error-message");
const reloadButton = document.getElementById("reload-button");
const touchControls = document.getElementById("touch-controls");
const debugHud = document.getElementById("debug-hud");

let engine = null;
let game = null;
let renderFrame = null;
let resizeTimer = 0;
const debugEnabled = new URLSearchParams(location.search).get("debug") === "1";

function setBoot(label, progress) {
  bootStatus.textContent = label;
  bootProgress.style.width = `${Math.max(4, Math.min(100, progress))}%`;
}

function showError(error) {
  console.error(error);
  boot.classList.add("hidden");
  errorScreen.classList.remove("hidden");
  errorMessage.textContent = error instanceof Error ? error.message : String(error);
}
window.__pixelFrontierBootError = showError;

function bindTouch() {
  const coarse = matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
  if (coarse) touchControls.classList.remove("hidden");
  for (const button of touchControls.querySelectorAll("button[data-action]")) {
    const action = button.dataset.action;
    const release = (event) => {
      event?.preventDefault();
      button.classList.remove("pressed");
      game?.virtualAction(action, false);
    };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.classList.add("pressed");
      try { button.setPointerCapture(event.pointerId); } catch {}
      game?.virtualAction(action, true);
    });
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
    button.addEventListener("contextmenu", (event) => event.preventDefault());
  }
}

function updateDebug() {
  if (!debugEnabled || !debugHud || !engine) return;
  debugHud.classList.remove("hidden");
  debugHud.textContent = `FPS ${engine.getFps().toFixed(0)}\nDPR ${window.devicePixelRatio.toFixed(2)}\n${innerWidth}×${innerHeight}`;
}

async function start() {
  try {
    setBoot("CARREGANDO BABYLONJS...", 18);
    engine = new Engine(canvas, false, {
      preserveDrawingBuffer: false,
      stencil: false,
      adaptToDeviceRatio: true,
      powerPreference: "high-performance",
      antialias: false,
    });
    setBoot("CRIANDO CENA...", 48);
    game = await createGameScene(engine, canvas);
    setBoot("PREPARANDO MISSÃO...", 82);
    renderFrame = () => { game.scene.render(); updateDebug(); };
    engine.runRenderLoop(renderFrame);

    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => engine?.resize(), 30);
    };
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onResize, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (!engine || !renderFrame) return;
      if (document.hidden) {
        game?.suspend?.();
        engine.stopRenderLoop(renderFrame);
      } else {
        engine.resize();
        engine.runRenderLoop(renderFrame);
      }
    });

    bindTouch();
    canvas.focus({ preventScroll: true });
    setBoot("PRONTO", 100);
    setTimeout(() => boot.classList.add("hidden"), 220);
  } catch (error) {
    showError(error);
  }
}

window.addEventListener("error", (event) => { if (!game) showError(event.error || event.message); });
window.addEventListener("unhandledrejection", (event) => { if (!game) showError(event.reason); });
reloadButton.addEventListener("click", () => location.reload());
start();
