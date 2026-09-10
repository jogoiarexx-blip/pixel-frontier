// Pixel Frontier: arte modular arcade militar, pensada para animação por partes.
import { assetSheetSprite, setAssetTint, sprite } from "./pixelArt.js";
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
    const files = {
        ari: "hero_ari_sheet.png",
        dax: "hero_dax_sheet.png",
        mika: "hero_mika_sheet.png",
        brutus: "hero_brutus_sheet.png",
    };
    const asset = assetUrl(files[data.id] ?? files.ari);
    return assetSheetSprite(scene, name, asset, 8, 2.95, 2.95, 0, 0.08);
}
export function sentrySprite(scene, name, role = "rifle") {
    const fileByRole = {
        rifle: "soldier_rifle_sheet.png",
        grenadier: "soldier_grenadier_sheet.png",
        machinegunner: "soldier_machinegunner_sheet.png",
        sniper: "soldier_sniper_sheet.png",
        shield: "soldier_shield_sheet.png",
    };
    return assetSheetSprite(scene, name, assetUrl(fileByRole[role] ?? fileByRole.rifle), 8, 2.75, 2.75, 0, 0.06);
}

export function combatSoldierSprite(scene, name, role = "rifle") {
    const root = sentrySprite(scene, name, role);
    setAssetTint(root, "#ffffff");
    if (role === "machinegunner") root.scaling.setAll(1.08);
    if (role === "shield") root.scaling.setAll(1.14);
    if (role === "sniper") root.scaling.setAll(0.96);
    if (role === "grenadier") root.scaling.setAll(1.02);
    return root;
}

export function droneSprite(scene, name) {
    return assetSheetSprite(scene, name, assetUrl("drone_sheet.png"), 4, 2.6, 1.95, 0, 0.03);
}
export function rescueSprite(scene, name) {
    return assetSheetSprite(scene, name, assetUrl("rescue_sheet.png"), 4, 1.55, 1.75, 0, 0.02);
}
export function roverSprite(scene, name) {
    return assetSheetSprite(scene, name, assetUrl("rover_sheet.png"), 4, 4.4, 2.95, 0.1, 0.02);
}
export function bossSprite(scene, name) {
    return assetSheetSprite(scene, name, assetUrl("boss_argo_sheet.png"), 18, 7.0, 4.65, 0, 0.10);
}
export function enemyJeepSprite(scene, name) {
    return assetSheetSprite(scene, name, assetUrl("enemy_jeep_sheet.png"), 4, 4.0, 2.65, 0.15, 0.02);
}
export function attackHelicopterSprite(scene, name) {
    return assetSheetSprite(scene, name, assetUrl("attack_helicopter_sheet.png"), 4, 5.0, 2.5, 0.3, 0.02);
}
