// Pixel Frontier: arte modular arcade militar, pensada para animação por partes.
import { assetSheetSprite, sprite } from "./pixelArt.js";
const INK = "#101418";
const SKIN = "#d7a16f";
const SKIN_DARK = "#9b6648";
const OLIVE = "#59643a";
const OLIVE_LIGHT = "#7b874e";
const KHAKI = "#b8a56a";
const STEEL = "#4c5a60";
const STEEL_LIGHT = "#89979b";
const RED = "#b93f32";
const ORANGE = "#e77a2e";
const YELLOW = "#f2c45f";
const SMOKE = "#68635b";
const assetUrl = (name) => `./assets/${name}`;
export function explorerSprite(scene, data, name) {
    const asset = data.id === "ari" ? assetUrl("hero_ari_sheet.png") : assetUrl("hero_dax_sheet.png");
    return assetSheetSprite(scene, name, asset, 8, 2.95, 2.95, 0, 0.08);
}
export function sentrySprite(scene, name) {
    return assetSheetSprite(scene, name, assetUrl("soldier_sheet.png"), 8, 2.75, 2.75, 0, 0.06);
}
export function droneSprite(scene, name) {
    return sprite(scene, name, [
        { tag: "wing-left", x: -0.82, y: 0.14, width: 0.78, height: 0.18, color: INK },
        { tag: "wing-right", x: 0.82, y: 0.14, width: 0.78, height: 0.18, color: INK },
        { tag: "rotor-left", x: -0.82, y: 0.30, width: 0.88, height: 0.08, color: STEEL_LIGHT },
        { tag: "rotor-right", x: 0.82, y: 0.30, width: 0.88, height: 0.08, color: STEEL_LIGHT },
        { tag: "body-outline", x: 0, y: 0, width: 1.28, height: 0.72, color: INK },
        { tag: "body", x: 0, y: 0.02, width: 1.04, height: 0.52, color: "#59636a" },
        { tag: "nose", x: 0.52, y: 0.01, width: 0.34, height: 0.30, color: RED },
        { tag: "lamp", x: 0.05, y: -0.05, width: 0.20, height: 0.16, color: YELLOW },
        { tag: "gun", x: 0.36, y: -0.38, width: 0.52, height: 0.12, color: INK },
    ], 0);
}
export function rescueSprite(scene, name) {
    return sprite(scene, name, [
        { tag: "head-outline", x: 0, y: 0.76, width: 0.72, height: 0.44, color: INK },
        { tag: "head", x: 0, y: 0.76, width: 0.54, height: 0.30, color: SKIN },
        { tag: "hair", x: -0.08, y: 0.91, width: 0.45, height: 0.10, color: "#6b4d30" },
        { tag: "body-outline", x: 0, y: 0.24, width: 0.70, height: 0.74, color: INK },
        { tag: "body", x: 0, y: 0.24, width: 0.52, height: 0.56, color: "#d9d2b9" },
        { tag: "rope", x: 0, y: 0.30, width: 0.62, height: 0.08, color: "#7a5936" },
        { tag: "leg-left", x: -0.18, y: -0.52, width: 0.22, height: 0.76, color: "#505f63" },
        { tag: "leg-right", x: 0.18, y: -0.52, width: 0.22, height: 0.76, color: "#505f63" },
    ]);
}
export function roverSprite(scene, name) {
    const root = sprite(scene, name, [
        { tag: "shadow", x: 0, y: -1.26, width: 3.70, height: 0.18, color: "#080a0b" },
        { tag: "tread-left", x: -1.10, y: -0.82, width: 1.18, height: 0.72, color: INK },
        { tag: "tread-right", x: 1.10, y: -0.82, width: 1.18, height: 0.72, color: INK },
        { tag: "wheel-left", x: -1.10, y: -0.82, width: 0.62, height: 0.50, color: STEEL },
        { tag: "wheel-right", x: 1.10, y: -0.82, width: 0.62, height: 0.50, color: STEEL },
        { tag: "hull-outline", x: 0, y: -0.24, width: 3.50, height: 0.92, color: INK },
        { tag: "hull", x: 0, y: -0.22, width: 3.20, height: 0.68, color: OLIVE },
        { tag: "armor", x: -0.48, y: 0.30, width: 1.65, height: 0.78, color: OLIVE_LIGHT },
        { tag: "hatch", x: -0.38, y: 0.70, width: 0.78, height: 0.16, color: INK },
        { tag: "star", x: -0.44, y: 0.28, width: 0.22, height: 0.22, color: KHAKI },
        { tag: "cannon-outline", x: 1.08, y: 0.42, width: 2.18, height: 0.30, color: INK },
        { tag: "cannon", x: 1.12, y: 0.42, width: 1.88, height: 0.14, color: STEEL_LIGHT },
        { tag: "muzzle", x: 2.22, y: 0.42, width: 0.42, height: 0.28, color: YELLOW },
    ], 0.1);
    root.getChildMeshes().find((m) => m.name === `${name}-muzzle`)?.setEnabled(false);
    return root;
}
export function bossSprite(scene, name) {
    return assetSheetSprite(scene, name, assetUrl("boss_argo_sheet.png"), 6, 7.0, 4.65, 0, 0.10);
}
export function enemyJeepSprite(scene, name) {
    const root = sprite(scene, name, [
        { tag: "shadow", x: 0, y: -0.72, width: 3.4, height: 0.18, color: "#080a0b" },
        { tag: "wheel-a", x: -1.05, y: -0.52, width: 0.72, height: 0.72, color: INK },
        { tag: "wheel-b", x: 1.05, y: -0.52, width: 0.72, height: 0.72, color: INK },
        { tag: "hub-a", x: -1.05, y: -0.52, width: 0.36, height: 0.36, color: STEEL_LIGHT },
        { tag: "hub-b", x: 1.05, y: -0.52, width: 0.36, height: 0.36, color: STEEL_LIGHT },
        { tag: "body-outline", x: 0, y: -0.12, width: 3.22, height: 0.92, color: INK },
        { tag: "body", x: 0, y: -0.08, width: 2.96, height: 0.70, color: "#4d5a32" },
        { tag: "hood", x: 1.05, y: 0.36, width: 1.15, height: 0.36, color: OLIVE_LIGHT },
        { tag: "cab", x: -0.45, y: 0.52, width: 1.20, height: 0.76, color: INK },
        { tag: "window", x: -0.35, y: 0.60, width: 0.72, height: 0.42, color: "#758a8c" },
        { tag: "gun", x: -0.82, y: 1.02, width: 1.28, height: 0.16, color: INK },
        { tag: "gun-metal", x: -0.88, y: 1.02, width: 1.04, height: 0.08, color: STEEL_LIGHT },
        { tag: "lamp", x: 1.55, y: 0.12, width: 0.20, height: 0.22, color: YELLOW },
    ], 0.15);
    return root;
}
export function attackHelicopterSprite(scene, name) {
    return sprite(scene, name, [
        { tag: "rotor", x: -0.15, y: 1.12, width: 4.8, height: 0.10, color: INK },
        { tag: "rotor-glint", x: -0.15, y: 1.12, width: 3.8, height: 0.04, color: STEEL_LIGHT },
        { tag: "tail", x: 1.55, y: 0.18, width: 2.4, height: 0.34, color: OLIVE },
        { tag: "tail-fin", x: 2.55, y: 0.55, width: 0.30, height: 1.0, color: OLIVE_LIGHT },
        { tag: "body-outline", x: -0.25, y: 0.10, width: 3.35, height: 1.28, color: INK },
        { tag: "body", x: -0.25, y: 0.12, width: 3.05, height: 1.02, color: "#53613a" },
        { tag: "cockpit", x: -1.13, y: 0.24, width: 0.92, height: 0.62, color: "#6e8688" },
        { tag: "skid-a", x: -0.82, y: -0.72, width: 1.35, height: 0.10, color: INK },
        { tag: "skid-b", x: 0.50, y: -0.72, width: 1.35, height: 0.10, color: INK },
        { tag: "gun", x: -1.18, y: -0.58, width: 0.72, height: 0.16, color: INK },
        { tag: "rocket", x: 0.42, y: -0.48, width: 1.16, height: 0.22, color: STEEL },
    ], 0.3);
}
