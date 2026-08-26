// Fronteira de Cobre: cena ortográfica lateral e ciclo de entrada do jogo.

import { Camera } from "@babylonjs/core/Cameras/camera";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { GameWorld } from "./GameWorld";

export interface GameHandle {
  scene: Scene;
  dispose: () => void;
}

export async function createGameScene(engine: Engine, canvas: HTMLCanvasElement): Promise<GameHandle> {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.04, 0.11, 0.15, 1);
  const camera = new FreeCamera("pixel-frontier-camera", new Vector3(0, 0, -10), scene);
  camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
  camera.setTarget(new Vector3(0, 0, 0));
  camera.minZ = 0.1;
  camera.maxZ = 100;

  const resizeCamera = () => {
    const aspect = Math.max(1, canvas.clientWidth / Math.max(1, canvas.clientHeight));
    const height = 15.5;
    camera.orthoTop = height / 2;
    camera.orthoBottom = -height / 2;
    camera.orthoLeft = -(height * aspect) / 2;
    camera.orthoRight = (height * aspect) / 2;
  };
  resizeCamera();

  const query = new URLSearchParams(window.location.search);
  const demoMode = query.has("demo") ? (query.get("demo") || "mission") : "";
  const debugScreen = query.get("screen") ?? "";
  const qualityOverride = query.get("quality") ?? "";
  const world = new GameWorld(scene, camera, demoMode, debugScreen, qualityOverride);
  const onKeyDown = (event: KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
    world.handleKeyDown(event.key);
  };
  const onKeyUp = (event: KeyboardEvent) => world.handleKeyUp(event.key);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  const resizeObserver = new ResizeObserver(resizeCamera);
  resizeObserver.observe(canvas);
  scene.onBeforeRenderObservable.add(() => world.update(engine.getDeltaTime() / 1000));

  return {
    scene,
    dispose: () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      resizeObserver.disconnect();
      world.dispose();
      scene.dispose();
    },
  };
}
