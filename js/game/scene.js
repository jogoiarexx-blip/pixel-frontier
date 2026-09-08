// Pixel Frontier: cena ortográfica lateral e ciclo de entrada do jogo.
import { Camera } from "@babylonjs/core/Cameras/camera.js";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera.js";
import { Color4 } from "@babylonjs/core/Maths/math.color.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { Scene } from "@babylonjs/core/scene.js";
import { GameWorld } from "./GameWorld.js";

export async function createGameScene(engine, canvas) {
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.04, 0.11, 0.15, 1);
    const camera = new FreeCamera("pixel-frontier-camera", new Vector3(0, 0, -10), scene);
    camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
    camera.setTarget(new Vector3(0, 0, 0));
    camera.minZ = 0.1;
    camera.maxZ = 100;

    const resizeCamera = () => {
        const width = Math.max(1, canvas.clientWidth || window.innerWidth || 1);
        const heightPx = Math.max(1, canvas.clientHeight || window.innerHeight || 1);
        const aspect = Math.max(0.55, Math.min(3.2, width / heightPx));
        const height = aspect < 0.8 ? 18.2 : 15.5;
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

    const onKeyDown = (event) => {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
        world.handleKeyDown(event.key, event.repeat);
    };
    const onKeyUp = (event) => world.handleKeyUp(event.key);
    const onBlur = () => world.clearInputs();
    const onPointerDown = () => { canvas.focus({ preventScroll: true }); world.audio.ensure(); };
    const onContextMenu = (event) => event.preventDefault();

    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    canvas.addEventListener("pointerdown", onPointerDown, { passive: true });
    canvas.addEventListener("contextmenu", onContextMenu);

    let resizeObserver = null;
    if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(resizeCamera);
        resizeObserver.observe(canvas);
    } else {
        window.addEventListener("resize", resizeCamera, { passive: true });
    }

    scene.onBeforeRenderObservable.add(() => world.update(engine.getDeltaTime() / 1000));
    return {
        scene,
        virtualAction: (action, pressed) => world.handleVirtualAction(action, pressed),
        suspend: () => world.suspendForVisibility(),
        clearInputs: () => world.clearInputs(),
        dispose: () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
            window.removeEventListener("blur", onBlur);
            canvas.removeEventListener("pointerdown", onPointerDown);
            canvas.removeEventListener("contextmenu", onContextMenu);
            if (resizeObserver) resizeObserver.disconnect();
            else window.removeEventListener("resize", resizeCamera);
            world.dispose();
            scene.dispose();
        },
    };
}
