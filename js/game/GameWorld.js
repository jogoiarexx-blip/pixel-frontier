// Fronteira de Cobre: mundo run-and-gun original, com estado explícito e UI no canvas.
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { attackHelicopterSprite, bossSprite, droneSprite, enemyJeepSprite, explorerSprite, rescueSprite, roverSprite, sentrySprite } from "./entities.js";
import { assetSheetSprite, meter, rect, setAssetFrame, sprite, textBoard } from "./pixelArt.js";
import { CHARACTERS, QUALITY_OPTIONS, WEAPONS } from "./types.js";
import { SaveManager } from "./systems/SaveManager.js";
import { AssetManager } from "./systems/AssetManager.js";
import { AudioManager } from "./systems/AudioManager.js";
import { LEVELS, getLevel } from "./systems/LevelData.js";
export class GameWorld {
    scene;
    camera;
    worldRoot;
    uiRoot;
    playerRoot;
    roverRoot;
    bossRoot;
    menuBoard;
    hudBoard;
    previewAri;
    previewDax;
    brandMark;
    bossMeter;
    mediumDetailRoot;
    highDetailRoot;
    dustMotes = [];
    state = "menu";
    selected = "ari";
    menuIndex = 0;
    controlIndex = 0;
    waitingForBinding = false;
    bindings = { left: "a", right: "d", jump: "w", down: "s", fire: "x", grenade: "shift", interact: "e", weapon: "q" };
    qualityIndex = 0;
    optionsIndex = 0;
    masterVolume = 0.8;
    musicVolume = 0.55;
    sfxVolume = 0.8;
    quality = "auto";
    save = new SaveManager();
    assets = new AssetManager();
    audio = new AudioManager();
    currentLevel = 1;
    difficulty = "normal";
    levelThemeRoot;
    loadingProgress = 0;
    loadingLabel = "PREPARANDO";
    checkpointX = 2;
    lastCheckpointIndex = -1;
    weapon = "rifle";
    weaponAmmo = { rifle: -1, vulcan: 0, shotgun: 0, rocket: 0, flame: 0 };
    weaponPickups = [];
    crouching = false;
    aimY = 0;
    roverHp = 12;
    autoQualityTimer = 0;
    frameSamples = [];
    gamepadLatch = new Set();
    keys = new Set();
    projectiles = [];
    projectilePool = [];
    combatFx = [];
    enemies = [];
    rescues = [];
    missionVehicles = [];
    surfaces = [];
    obstacles = [];
    securitySwitches = [];
    securityDoors = [];
    groundTraps = [];
    player = {
        x: 2, y: -5.15, vy: 0, dir: 1, health: 4, grenades: 3, score: 0, rescued: 0, invincible: 0, inRover: false,
    };
    boss = { active: false, hp: 36, maxHp: 36, cooldown: 1.5, direction: -1 };
    fireTimer = 0;
    grenadeTimer = 0;
    elapsed = 0;
    demoTime = 0;
    hasRover = false;
    dirtyHud = 0;
    shotFlash = 0;
    cameraShake = 0;
    bossPhaseSpawned = new Set();
    securityNotice = "SETOR A: ABRIR BARRICADA";
    playerHitbox = { x: 0, y: 0.74, halfWidth: 0.42, halfHeight: 0.78 };
    roverHitbox = { x: 0, y: 0.18, halfWidth: 1.58, halfHeight: 0.72 };
    bossHitbox = { x: 84, y: -4.46, halfWidth: 2.55, halfHeight: 1.00 };
    isDemo;
    demoBoss;
    demoTerrain;
    demoSecurity;
    constructor(scene, camera, demoMode = "", debugScreen = "", qualityOverride = "") {
        this.scene = scene;
        this.camera = camera;
        this.isDemo = demoMode.length > 0;
        this.demoBoss = demoMode === "boss";
        this.demoTerrain = demoMode === "terrain";
        this.demoSecurity = demoMode === "security";
        const saved = this.save.snapshot;
        const candidate = qualityOverride || saved.settings.quality || "auto";
        this.quality = candidate === "auto" || candidate === "low" || candidate === "medium" || candidate === "high" ? candidate : "auto";
        this.qualityIndex = Math.max(0, QUALITY_OPTIONS.findIndex((option) => option.id === this.quality));
        this.currentLevel = Math.max(1, Math.min(LEVELS.length, saved.currentLevel || 1));
        this.difficulty = saved.settings.difficulty;
        this.checkpointX = saved.currentLevel === this.currentLevel ? saved.checkpointX : 2;
        this.masterVolume = saved.settings.masterVolume;
        this.musicVolume = saved.settings.musicVolume;
        this.sfxVolume = saved.settings.sfxVolume;
        this.audio.setVolumes(this.masterVolume, this.musicVolume, this.sfxVolume);
        try {
            const raw = window.localStorage.getItem("pixel-frontier-bindings");
            if (raw)
                this.bindings = { ...this.bindings, ...JSON.parse(raw) };
        }
        catch { }
        this.worldRoot = new TransformNode("world-root", scene);
        this.levelThemeRoot = new TransformNode("level-theme-root", scene);
        this.levelThemeRoot.parent = this.worldRoot;
        this.uiRoot = new TransformNode("ui-root", scene);
        this.playerRoot = explorerSprite(scene, CHARACTERS.ari, "hero-ari");
        this.playerRoot.parent = this.worldRoot;
        this.roverRoot = roverSprite(scene, "rover-9");
        this.roverRoot.parent = this.worldRoot;
        this.bossRoot = bossSprite(scene, "excavator-argo");
        this.bossRoot.parent = this.worldRoot;
        this.mediumDetailRoot = new TransformNode("medium-quality-geometry", scene);
        this.mediumDetailRoot.parent = this.worldRoot;
        this.highDetailRoot = new TransformNode("high-quality-geometry", scene);
        this.highDetailRoot.parent = this.worldRoot;
        this.buildEnvironment();
        this.buildInteractiveTerrain();
        this.buildSecurityRoute();
        this.menuBoard = textBoard(scene, "screen-board", 18.6, 10.4, { x: 0, y: 0, z: -3 });
        this.menuBoard.root.parent = this.uiRoot;
        this.brandMark = sprite(scene, "broken-compass-mark", [
            { x: 0, y: 0, width: 1.6, height: 0.28, color: "#e6752a" },
            { x: 0, y: 0, width: 0.28, height: 1.6, color: "#e6752a" },
            { x: -0.46, y: 0.46, width: 0.48, height: 0.48, color: "#f1bf5d" },
            { x: 0.46, y: -0.46, width: 0.48, height: 0.48, color: "#41d6d1" },
            { x: 0.46, y: 0.46, width: 0.20, height: 0.20, color: "#0a1720" },
            { x: -0.46, y: -0.46, width: 0.20, height: 0.20, color: "#0a1720" },
        ], -3.8);
        this.brandMark.parent = this.uiRoot;
        this.brandMark.position.set(-10.7, 6.1, 0);
        this.previewAri = explorerSprite(scene, CHARACTERS.ari, "preview-ari");
        this.previewAri.parent = this.uiRoot;
        this.previewAri.position.set(-11.2, -1.0, -3.55);
        this.previewAri.scaling.setAll(1.45);
        this.previewDax = explorerSprite(scene, CHARACTERS.dax, "preview-dax");
        this.previewDax.parent = this.uiRoot;
        this.previewDax.position.set(-11.2, -1.0, -3.55);
        this.previewDax.scaling.setAll(1.45);
        this.hudBoard = textBoard(scene, "hud-board", 13.2, 2.65, { x: -8.8, y: 6.55, z: -3 });
        this.hudBoard.root.parent = this.uiRoot;
        this.bossMeter = meter(scene, "argo-core", 9.6, "#e6752a", this.uiRoot, 5.5, 6.65);
        this.bossMeter.root.position.z = -3;
        this.applyQuality();
        this.resetMission();
        this.showMenu();
        if (debugScreen === "select") {
            this.state = "select";
            this.renderMenu();
        }
        if (debugScreen === "quality") {
            this.state = "quality";
            this.renderMenu();
        }
        if (this.demoBoss)
            this.startMission();
        else if (this.isDemo)
            window.setTimeout(() => this.startMission(), 500);
    }
    buildEnvironment() {
        // Céu quente de zona de guerra, em camadas largas para manter o custo baixo.
        rect(this.scene, "sky", 180, 52, "#5a6f72", this.worldRoot, 70, 4, 5);
        rect(this.scene, "sunset-band", 180, 9, "#c88a55", this.worldRoot, 70, -0.6, 4.9);
        rect(this.scene, "sun", 4.6, 4.6, "#f3c96d", this.worldRoot, 31, 4.4, 4.7);
        // Montanhas e silhuetas urbanas quebram a repetição do horizonte.
        for (let i = 0; i < 15; i += 1) {
            const x = i * 11.2 - 4;
            const h = 2.8 + (i % 4) * 0.9;
            rect(this.scene, `mountain-${i}`, 10.4, h, i % 2 ? "#684d43" : "#765548", this.worldRoot, x, -3.2, 4.45);
            rect(this.scene, `mountain-rim-${i}`, 9.8, 0.28, "#9a6850", this.worldRoot, x, -3.2 + h / 2, 4.4);
        }
        for (let i = 0; i < 18; i += 1) {
            const x = i * 8.6 + 2;
            const h = 2.2 + (i % 5) * 0.55;
            const building = sprite(this.scene, `ruined-building-${i}`, [
                { tag: "wall", x: 0, y: h / 2, width: 5.7, height: h, color: i % 2 ? "#8a765d" : "#776854" },
                { tag: "roof", x: -0.35, y: h + 0.08, width: 5.0, height: 0.28, color: "#3d3933" },
                { tag: "window-a", x: -1.35, y: Math.min(h - 0.55, 1.25), width: 0.62, height: 0.76, color: "#242b2a" },
                { tag: "window-b", x: 0.15, y: Math.min(h - 0.60, 1.45), width: 0.62, height: 0.76, color: "#242b2a" },
                { tag: "window-c", x: 1.52, y: Math.min(h - 0.72, 1.10), width: 0.56, height: 0.66, color: "#242b2a" },
                { tag: "damage", x: 2.52, y: h * 0.72, width: 0.62, height: 0.82, color: "#4a4339" },
            ], 4.05);
            building.parent = this.mediumDetailRoot;
            building.position.set(x, -5.9, 0);
        }
        // Chão irregular em segmentos: as cores variam e recebem pedras, tábuas e crateras.
        for (let i = 0; i < 30; i += 1) {
            const x = i * 4.8;
            rect(this.scene, `ground-${i}`, 4.95, 2.05, i % 3 === 0 ? "#8a6845" : i % 3 === 1 ? "#9a744b" : "#7d6043", this.worldRoot, x, -7.0, 2.6);
            rect(this.scene, `ground-lip-${i}`, 4.80, 0.18, i % 2 ? "#b28a57" : "#a77b4a", this.worldRoot, x, -6.02, 2.55);
            if (i % 2 === 0)
                rect(this.scene, `ground-rubble-${i}`, 0.72, 0.24, "#4e493f", this.mediumDetailRoot, x + 1.1, -5.88, 2.45);
            if (i % 5 === 0)
                rect(this.scene, `ground-crater-${i}`, 1.18, 0.20, "#403c35", this.mediumDetailRoot, x - 0.8, -5.90, 2.42);
        }
        // Barricadas, sacos de areia e sinalização militar.
        [8, 18, 33, 48, 63, 78].forEach((x, index) => {
            const barricade = sprite(this.scene, `barricade-${index}`, [
                { tag: "sand-a", x: -0.78, y: 0.22, width: 0.92, height: 0.38, color: "#8c805d" },
                { tag: "sand-b", x: 0.04, y: 0.20, width: 0.92, height: 0.38, color: "#a09167" },
                { tag: "sand-c", x: 0.82, y: 0.22, width: 0.92, height: 0.38, color: "#8c805d" },
                { tag: "sand-top-a", x: -0.38, y: 0.58, width: 0.92, height: 0.38, color: "#aa9a70" },
                { tag: "sand-top-b", x: 0.45, y: 0.58, width: 0.92, height: 0.38, color: "#97885f" },
                { tag: "post", x: -1.48, y: 0.73, width: 0.18, height: 1.48, color: "#34342f" },
                { tag: "flag", x: -1.12, y: 1.18, width: 0.76, height: 0.36, color: index % 2 ? "#8e342b" : "#59643a" },
            ], 1.7);
            barricade.parent = this.worldRoot;
            barricade.position.set(x, -5.88, 0);
        });
        [13, 27, 39, 55, 72, 88].forEach((x, index) => {
            const props = sprite(this.scene, `war-props-${index}`, [
                { tag: "barrel-a", x: -0.58, y: 0.42, width: 0.52, height: 0.84, color: index % 2 ? "#6b4d35" : "#59643a" },
                { tag: "barrel-band-a", x: -0.58, y: 0.42, width: 0.58, height: 0.10, color: "#292d2d" },
                { tag: "crate", x: 0.28, y: 0.34, width: 0.86, height: 0.70, color: "#8b663f" },
                { tag: "crate-line", x: 0.28, y: 0.34, width: 0.12, height: 0.64, color: "#5f472f" },
                { tag: "ammo", x: 0.92, y: 0.20, width: 0.46, height: 0.42, color: "#424b35" },
            ], 1.2);
            props.parent = this.mediumDetailRoot;
            props.position.set(x, -5.92, 0);
        });
        // Postes, cabos e fumaça dão profundidade ao primeiro plano.
        [4, 25, 44, 66, 86].forEach((x, index) => {
            const post = sprite(this.scene, `utility-post-${index}`, [
                { tag: "pole", x: 0, y: 2.3, width: 0.22, height: 4.6, color: "#34312d" },
                { tag: "cross", x: 0, y: 4.15, width: 1.48, height: 0.16, color: "#34312d" },
                { tag: "lamp", x: 0.55, y: 3.86, width: 0.28, height: 0.26, color: "#f2c45f" },
            ], 3.2);
            post.parent = this.mediumDetailRoot;
            post.position.set(x, -5.9, 0);
        });
        for (let i = 0; i < 34; i += 1) {
            const x = (i * 9.1) % 150;
            const y = -4.2 + (i % 7) * 1.4;
            const mote = rect(this.scene, `ash-${i}`, 0.10 + (i % 3) * 0.04, 0.08 + (i % 2) * 0.05, i % 4 === 0 ? "#d8bb83" : "#7f776d", this.highDetailRoot, x, y, 3.8);
            this.dustMotes.push({ mesh: mote, x, y, phase: i * 0.73 });
        }
        rect(this.scene, "path-shadow", 180, 0.56, "#58483a", this.worldRoot, 70, -5.69, 1.4);
    }
    buildInteractiveTerrain() {
        const platformSpecs = [
            ["platform-ore-bridge", 16.5, 3.1, -3.65],
            ["platform-signal-deck", 31.8, 2.45, -2.78],
            ["platform-rover-ramp", 46.0, 3.45, -3.35],
            ["platform-argo-gate", 64.0, 2.75, -2.62],
        ];
        platformSpecs.forEach(([id, x, halfWidth, landY], index) => {
            const platform = sprite(this.scene, id, [
                { tag: "plate-outline", x: 0, y: 0, width: halfWidth * 2 + 0.24, height: 0.38, color: "#07141d" },
                { tag: "plate", x: 0, y: 0.05, width: halfWidth * 2, height: 0.22, color: index % 2 ? "#31535f" : "#426b70" },
                { tag: "hazard", x: 0, y: 0.06, width: halfWidth * 1.38, height: 0.08, color: "#e6752a" },
                { tag: "support-left", x: -halfWidth + 0.48, y: -0.86, width: 0.32, height: 1.52, color: "#07141d" },
                { tag: "support-right", x: halfWidth - 0.48, y: -0.86, width: 0.32, height: 1.52, color: "#07141d" },
                { tag: "lamp", x: -halfWidth + 0.48, y: 0.36, width: 0.20, height: 0.20, color: "#41d6d1" },
            ], 1.5);
            platform.parent = this.worldRoot;
            platform.position.set(x, landY - 1.20, 0);
            this.surfaces.push({ id, x, halfWidth, landY });
        });
        const obstacleSpecs = [
            { id: "ammo-crates-a", x: 22.8, y: -4.42, width: 1.38, height: 1.55, hp: 4, destructible: true, accent: "#d8b45d" },
            { id: "fuel-drum-stack", x: 41.8, y: -4.22, width: 1.18, height: 1.90, hp: 3, destructible: true, accent: "#b84732" },
            { id: "machinegun-nest", x: 57.4, y: -4.10, width: 1.72, height: 2.04, hp: 8, destructible: true, accent: "#7f8b51" },
            { id: "concrete-roadblock", x: 69.2, y: -4.56, width: 1.48, height: 1.30, hp: 0, destructible: false, accent: "#b8a56a" },
        ];
        obstacleSpecs.forEach((spec) => {
            const root = sprite(this.scene, spec.id, [
                { tag: "outline", x: 0, y: 0, width: spec.width + 0.18, height: spec.height + 0.18, color: "#07141d" },
                { tag: "body", x: 0, y: 0, width: spec.width, height: spec.height, color: spec.destructible ? "#31535f" : "#263d4a" },
                { tag: "core", x: 0, y: 0.18, width: spec.width * 0.56, height: 0.22, color: spec.accent },
                { tag: "mark", x: 0, y: -0.30, width: spec.width * 0.34, height: 0.16, color: "#d9aa62" },
            ], 0.8);
            root.parent = this.worldRoot;
            root.position.set(spec.x, spec.y, 0);
            this.obstacles.push({ id: spec.id, root, box: { x: spec.x, y: spec.y, halfWidth: spec.width / 2, halfHeight: spec.height / 2 }, hp: spec.hp, maxHp: spec.hp, destructible: spec.destructible, active: true });
        });
    }
    buildSecurityRoute() {
        const switchSpecs = [
            { id: "console-alpha", doorId: "gate-alpha", x: 11.2, y: -4.22, accent: "#41d6d1" },
            { id: "console-beta", doorId: "gate-beta", x: 48.0, y: -2.55, accent: "#f1bf5d" },
        ];
        switchSpecs.forEach((spec) => {
            const root = sprite(this.scene, spec.id, [
                { tag: "base", x: 0, y: 0, width: 0.94, height: 0.92, color: "#07141d" },
                { tag: "case", x: 0, y: 0.02, width: 0.72, height: 0.68, color: "#31535f" },
                { tag: "label", x: 0, y: 0.24, width: 0.36, height: 0.12, color: spec.accent },
                { tag: "lamp-off", x: 0, y: -0.18, width: 0.22, height: 0.22, color: "#c45428" },
                { tag: "lamp-on", x: 0, y: -0.18, width: 0.30, height: 0.30, color: spec.accent },
            ], 0.5);
            root.parent = this.worldRoot;
            root.position.set(spec.x, spec.y, 0);
            this.setPartVisible(root, "lamp-on", false);
            this.securitySwitches.push({ id: spec.id, doorId: spec.doorId, root, box: { x: spec.x, y: spec.y, halfWidth: 0.72, halfHeight: 0.88 }, activated: false });
        });
        const doorSpecs = [
            { id: "gate-alpha", x: 27.0, accent: "#41d6d1" },
            { id: "gate-beta", x: 61.5, accent: "#f1bf5d" },
        ];
        doorSpecs.forEach((spec) => {
            const closedY = -3.70;
            const root = sprite(this.scene, spec.id, [
                { tag: "frame", x: 0, y: 0, width: 1.86, height: 4.18, color: "#07141d" },
                { tag: "slabs", x: 0, y: 0, width: 1.48, height: 3.82, color: "#263d4a" },
                { tag: "signal", x: 0, y: 0.62, width: 0.76, height: 0.24, color: spec.accent },
                { tag: "braces", x: 0, y: -0.72, width: 1.12, height: 0.20, color: "#e6752a" },
            ], 0.7);
            root.parent = this.worldRoot;
            root.position.set(spec.x, closedY, 0);
            this.securityDoors.push({ id: spec.id, root, box: { x: spec.x, y: closedY, halfWidth: 0.74, halfHeight: 1.90 }, closedY, open: false });
        });
        [7.2, 35.8, 54.2].forEach((x, index) => {
            const root = sprite(this.scene, `floor-trap-${index}`, [
                { tag: "channel", x: 0, y: 0, width: 2.24, height: 0.28, color: "#07141d" },
                { tag: "plate", x: 0, y: 0.06, width: 1.96, height: 0.12, color: "#31535f" },
                { tag: "spike-left", x: -0.54, y: 0.30, width: 0.16, height: 0.50, color: "#e6752a" },
                { tag: "spike-mid", x: 0, y: 0.30, width: 0.16, height: 0.50, color: "#f1bf5d" },
                { tag: "spike-right", x: 0.54, y: 0.30, width: 0.16, height: 0.50, color: "#e6752a" },
            ], 0.9);
            root.parent = this.worldRoot;
            root.position.set(x, -5.92, 0);
            this.groundTraps.push({ id: `floor-trap-${index}`, root, box: { x, y: -5.16, halfWidth: 1.02, halfHeight: 0.34 }, cooldown: 0 });
        });
    }
    applyQuality() {
        const effective = this.quality === "auto" ? "medium" : this.quality;
        this.mediumDetailRoot.setEnabled(effective === "medium" || effective === "high");
        this.highDetailRoot.setEnabled(effective === "high");
    }
    setQuality(next) {
        this.quality = next;
        this.qualityIndex = QUALITY_OPTIONS.findIndex((option) => option.id === next);
        this.save.update({ settings: { ...this.save.snapshot.settings, quality: next } });
        this.applyQuality();
    }
    applyLevelTheme() {
        this.levelThemeRoot.dispose();
        this.levelThemeRoot = new TransformNode(`level-theme-${this.currentLevel}`, this.scene);
        this.levelThemeRoot.parent = this.worldRoot;
        const id = this.currentLevel;
        const colors = ["#8a765d", "#69757d", "#536747", "#4e5960", "#704b42"];
        const accent = colors[id - 1] ?? colors[0];
        for (let i = 0; i < 12; i += 1) {
            const x = 5 + i * 7.1;
            if (id === 2) {
                rect(this.scene, `bridge-girder-${i}`, 0.34, 3.4 + (i % 2), accent, this.levelThemeRoot, x, -3.9, 1.8);
                rect(this.scene, `bridge-rail-${i}`, 6.2, 0.16, "#9da4a5", this.levelThemeRoot, x, -2.55, 1.7);
            }
            else if (id === 3) {
                rect(this.scene, `jungle-trunk-${i}`, 0.52, 3.0 + (i % 3) * 0.6, "#4b3c2d", this.levelThemeRoot, x, -3.8, 1.8);
                rect(this.scene, `jungle-leaf-${i}`, 2.2, 1.0, accent, this.levelThemeRoot, x + (i % 2 ? 0.5 : -0.4), -1.9, 1.75);
            }
            else if (id === 4) {
                rect(this.scene, `base-pipe-${i}`, 5.4, 0.18, accent, this.levelThemeRoot, x, -2.8 - (i % 3) * 0.65, 1.8);
                rect(this.scene, `base-light-${i}`, 0.24, 0.24, i % 2 ? "#e85b32" : "#f2c45f", this.levelThemeRoot, x + 1.4, -2.8 - (i % 3) * 0.65, 1.7);
            }
            else if (id === 5) {
                rect(this.scene, `fort-wall-${i}`, 5.8, 2.4 + (i % 2) * 0.7, accent, this.levelThemeRoot, x, -4.6, 1.85);
                rect(this.scene, `fort-slit-${i}`, 0.74, 0.20, "#171b1d", this.levelThemeRoot, x, -3.8, 1.7);
            }
            else {
                rect(this.scene, `village-sign-${i}`, 1.8, 0.28, accent, this.levelThemeRoot, x, -3.2, 1.8);
            }
        }
    }
    createMissionActors() {
        this.enemies.forEach((enemy) => enemy.root.dispose());
        this.rescues.forEach((rescue) => rescue.root.dispose());
        this.missionVehicles.forEach((vehicle) => vehicle.root.dispose());
        this.enemies = [];
        this.rescues = [];
        this.missionVehicles = [];
        // Ondas de combate: os soldados entram quando o jogador alcança cada setor.
        const specs = [
            ["sentry", 10.5, -5.15, 5.5, 13.0], ["sentry", 13.0, -5.15, 7.0, 15.5],
            ["drone", 19.0, -2.7, 13.0, 20.0], ["sentry", 25.0, -5.15, 18.5, 29.0],
            ["sentry", 29.0, -5.15, 21.5, 33.0], ["drone", 35.0, -3.0, 28.0, 36.0],
            ["sentry", 43.0, -5.15, 36.0, 47.0], ["sentry", 50.0, -5.15, 43.0, 54.0],
            ["drone", 55.0, -2.8, 48.0, 56.0], ["sentry", 61.0, -5.15, 54.0, 65.0],
            ["sentry", 65.0, -5.15, 57.0, 69.0], ["drone", 67.0, -3.1, 60.0, 68.0],
        ];
        specs.forEach(([kind, x, y, triggerX, entryX], index) => {
            const root = kind === "sentry" ? sentrySprite(this.scene, `sentry-${index}`) : droneSprite(this.scene, `drone-${index}`);
            root.parent = this.worldRoot;
            const startX = entryX + (kind === "sentry" ? 7.0 : 5.0);
            const startY = kind === "drone" ? y + 5.5 : y;
            root.position.set(startX, startY, 0);
            root.setEnabled(false);
            const level = getLevel(this.currentLevel);
            const diffHp = this.difficulty === "easy" ? 0.82 : this.difficulty === "hard" ? 1.28 : 1;
            const diffFire = this.difficulty === "easy" ? 1.22 : this.difficulty === "hard" ? 0.82 : 1;
            const hp = Math.max(2, Math.round(2 * level.enemyHpScale * diffHp));
            this.enemies.push({ root, x: startX, y, hp, maxHp: hp, cooldown: (0.7 + index * 0.14) * level.enemyFireScale * diffFire, kind, drift: index * 1.2, alive: true, active: false, triggerX, entryX, entering: true });
        });
        [10, 28, 52].forEach((x, index) => {
            const root = rescueSprite(this.scene, `rescue-${index}`);
            root.parent = this.worldRoot;
            root.position.set(x, -5.15, 0);
            this.rescues.push({ root, x, active: true });
        });
        const jeepA = enemyJeepSprite(this.scene, "reinforcement-jeep-a");
        jeepA.parent = this.worldRoot;
        jeepA.position.set(39, -5.10, 0);
        jeepA.setEnabled(false);
        this.missionVehicles.push({ kind: "jeep", root: jeepA, triggerX: 22.5, targetX: 31.5, active: false, completed: false, spawned: false, cooldown: 0 });
        const heli = attackHelicopterSprite(this.scene, "attack-helicopter-a");
        heli.parent = this.worldRoot;
        heli.position.set(61, 3.7, 0);
        heli.setEnabled(false);
        this.missionVehicles.push({ kind: "helicopter", root: heli, triggerX: 40.5, targetX: 50.0, active: false, completed: false, spawned: false, cooldown: 0.35 });
        const jeepB = enemyJeepSprite(this.scene, "reinforcement-jeep-b");
        jeepB.parent = this.worldRoot;
        jeepB.position.set(77, -5.10, 0);
        jeepB.setEnabled(false);
        this.missionVehicles.push({ kind: "jeep", root: jeepB, triggerX: 57.5, targetX: 67.5, active: false, completed: false, spawned: false, cooldown: 0 });
    }
    spawnReinforcementSoldier(x, label) {
        const root = sentrySprite(this.scene, `reinforcement-${label}-${Math.random().toString(36).slice(2)}`);
        root.parent = this.worldRoot;
        root.position.set(x, -5.15, 0);
        const level = getLevel(this.currentLevel);
        const diffHp = this.difficulty === "easy" ? 0.82 : this.difficulty === "hard" ? 1.28 : 1;
        const diffFire = this.difficulty === "easy" ? 1.22 : this.difficulty === "hard" ? 0.82 : 1;
        const hp = Math.max(2, Math.round(2 * level.enemyHpScale * diffHp));
        this.enemies.push({ root, x, y: -5.15, hp, maxHp: hp, cooldown: (0.5 + Math.random() * 0.7) * level.enemyFireScale * diffFire, kind: "sentry", drift: Math.random() * 5, alive: true, active: true, triggerX: -1, entryX: x, entering: false });
    }
    updateMissionVehicles(dt) {
        for (const vehicle of this.missionVehicles) {
            if (vehicle.completed)
                continue;
            if (!vehicle.active && this.player.x >= vehicle.triggerX) {
                vehicle.active = true;
                vehicle.root.setEnabled(true);
            }
            if (!vehicle.active)
                continue;
            if (vehicle.kind === "jeep") {
                const dx = vehicle.targetX - vehicle.root.position.x;
                if (Math.abs(dx) > 0.18) {
                    vehicle.root.position.x += Math.sign(dx) * dt * 7.6;
                    vehicle.root.rotation.z = Math.sin(this.elapsed * 17) * 0.015;
                    this.animatePart(vehicle.root, "wheel-a", 0, Math.sin(this.elapsed * 23) * 0.06);
                    this.animatePart(vehicle.root, "wheel-b", 0, -Math.sin(this.elapsed * 23) * 0.06);
                }
                else if (!vehicle.spawned) {
                    vehicle.spawned = true;
                    this.spawnCombatFx(vehicle.targetX + 1.4, -5.0, "smoke");
                    this.spawnReinforcementSoldier(vehicle.targetX + 0.7, "jeep");
                    this.spawnReinforcementSoldier(vehicle.targetX + 1.5, "jeep");
                    this.spawnReinforcementSoldier(vehicle.targetX + 2.3, "jeep");
                    vehicle.cooldown = 1.1;
                }
                else {
                    vehicle.cooldown -= dt;
                    if (vehicle.cooldown <= 0) {
                        vehicle.root.position.x += dt * 7.8;
                        if (vehicle.root.position.x > vehicle.targetX + 11) {
                            vehicle.root.setEnabled(false);
                            vehicle.completed = true;
                        }
                    }
                }
            }
            else {
                vehicle.root.position.x -= dt * 4.8;
                vehicle.root.position.y = 3.7 + Math.sin(this.elapsed * 3.2) * 0.24;
                this.animatePart(vehicle.root, "rotor", Math.sin(this.elapsed * 45) * 0.8, 0);
                vehicle.cooldown -= dt;
                if (vehicle.cooldown <= 0 && Math.abs(vehicle.root.position.x - this.player.x) < 11) {
                    this.spawnProjectile(vehicle.root.position.x - 1.2, vehicle.root.position.y - 0.7, -5.5, -5.6, false, 1, true);
                    vehicle.cooldown = 1.25;
                }
                if (!vehicle.spawned && vehicle.root.position.x <= vehicle.targetX) {
                    vehicle.spawned = true;
                    this.spawnReinforcementSoldier(vehicle.targetX + 0.5, "heli");
                    this.spawnReinforcementSoldier(vehicle.targetX + 1.5, "heli");
                    this.spawnCombatFx(vehicle.targetX + 1, -4.7, "smoke");
                }
                if (vehicle.root.position.x < vehicle.targetX - 13) {
                    vehicle.root.setEnabled(false);
                    vehicle.completed = true;
                }
            }
        }
    }
    resetObstacles() {
        for (const obstacle of this.obstacles) {
            obstacle.active = true;
            obstacle.root.setEnabled(true);
            obstacle.root.scaling.setAll(1);
            obstacle.hp = obstacle.maxHp;
        }
    }
    createWeaponPickups() {
        this.weaponPickups.forEach((pickup) => pickup.root.dispose());
        this.weaponPickups.length = 0;
        const specs = [
            [16, "vulcan", 120, "V"], [33, "shotgun", 18, "S"], [51, "rocket", 8, "R"], [64, "flame", 60, "F"],
        ];
        for (const [x, weapon, ammo, label] of specs) {
            const root = sprite(this.scene, `weapon-${weapon}-${x}`, [
                { tag: "crate", x: 0, y: 0, width: 0.9, height: 0.72, color: "#3c4931" },
                { tag: "rim", x: 0, y: 0.28, width: 0.82, height: 0.12, color: "#b8a56a" },
                { tag: "mark", x: 0, y: 0.02, width: 0.28, height: 0.28, color: "#f2c45f" },
            ], -0.2);
            root.parent = this.worldRoot;
            root.position.set(x, -5.15, 0);
            root.metadata = { label };
            this.weaponPickups.push({ id: `${weapon}-${x}`, root, x, y: -5.15, weapon, ammo, active: true });
        }
    }
    updateWeaponPickups() {
        for (const pickup of this.weaponPickups) {
            if (!pickup.active)
                continue;
            pickup.root.position.y = pickup.y + Math.sin(this.elapsed * 3 + pickup.x) * 0.10;
            if (!this.overlaps(this.activePlayerBox(), { x: pickup.x, y: pickup.y, halfWidth: 0.55, halfHeight: 0.65 }))
                continue;
            pickup.active = false;
            pickup.root.setEnabled(false);
            this.weapon = pickup.weapon;
            this.weaponAmmo[pickup.weapon] = Math.min(WEAPONS[pickup.weapon].maxAmmo, Math.max(0, this.weaponAmmo[pickup.weapon]) + pickup.ammo);
            this.audio.sfxPlay("pickup");
            this.securityNotice = `ARMA: ${WEAPONS[pickup.weapon].label}`;
        }
    }
    updateCheckpoint() {
        const checkpoints = getLevel(this.currentLevel).checkpoints;
        const next = checkpoints.findIndex((x, index) => index > this.lastCheckpointIndex && this.player.x >= x);
        if (next >= 0) {
            this.lastCheckpointIndex = next;
            this.checkpointX = checkpoints[next];
            this.save.setCheckpoint(this.currentLevel, this.checkpointX);
            this.audio.sfxPlay("checkpoint");
            this.securityNotice = `CHECKPOINT ${next + 1}/${checkpoints.length}`;
            this.player.health = CHARACTERS[this.selected].maxHealth;
        }
    }
    resetMission() {
        this.projectiles.forEach((projectile) => this.releaseProjectileMesh(projectile.mesh));
        this.projectiles = [];
        this.cameraShake = 0;
        this.bossPhaseSpawned.clear();
        this.combatFx.forEach((fx) => fx.root.dispose());
        this.combatFx = [];
        this.selected = this.selected;
        const data = CHARACTERS[this.selected];
        this.playerRoot.dispose();
        const visual = explorerSprite(this.scene, data, `hero-${data.id}`);
        visual.parent = this.worldRoot;
        this.playerRoot = visual;
        const startX = Math.max(getLevel(this.currentLevel).playerStartX, this.checkpointX || 2);
        this.player = { x: startX, y: -5.15, vy: 0, dir: 1, health: data.maxHealth, grenades: data.grenades, score: 0, rescued: 0, invincible: 0, inRover: false };
        this.weapon = "rifle";
        this.weaponAmmo = { rifle: -1, vulcan: 0, shotgun: 0, rocket: 0, flame: 0 };
        this.roverHp = 12;
        this.lastCheckpointIndex = getLevel(this.currentLevel).checkpoints.filter((x) => x <= startX).length - 1;
        this.roverRoot.position.set(36, -5.15, 0);
        this.roverRoot.setEnabled(true);
        this.bossRoot.position.set(84, -4.68, 0);
        this.bossRoot.setEnabled(false);
        const bossHp = Math.round(36 * getLevel(this.currentLevel).enemyHpScale * (this.difficulty === "easy" ? 0.85 : this.difficulty === "hard" ? 1.25 : 1));
        this.boss = { active: false, hp: bossHp, maxHp: bossHp, cooldown: 1.5, direction: -1 };
        this.hasRover = false;
        this.applyLevelTheme();
        this.resetObstacles();
        this.resetSecurityRoute();
        this.createMissionActors();
        this.createWeaponPickups();
        this.syncPlayerVisual();
    }
    showMenu() {
        this.state = "menu";
        this.audio.stopMusic();
        const saved = this.save.snapshot;
        this.currentLevel = Math.max(1, Math.min(LEVELS.length, saved.currentLevel || this.currentLevel));
        this.checkpointX = saved.currentLevel === this.currentLevel ? saved.checkpointX : 2;
        this.menuIndex = 0;
        this.menuBoard.visible(true);
        this.hudBoard.visible(false);
        this.bossMeter.root.setEnabled(false);
        this.previewAri.setEnabled(false);
        this.previewDax.setEnabled(false);
        this.brandMark.setEnabled(true);
        this.renderMenu();
    }
    renderMenu() {
        const previewVisible = this.state === "select";
        this.previewAri.setEnabled(previewVisible && this.selected === "ari");
        this.previewDax.setEnabled(previewVisible && this.selected === "dax");
        this.brandMark.setEnabled(this.state !== "play");
        if (this.state === "menu") {
            const save = this.save.snapshot;
            this.menuBoard.setText("PIXEL FRONTIER", ["CONTINUAR CAMPANHA", "MANUAL DE CAMPO", `OPÇÕES // ${QUALITY_OPTIONS[this.qualityIndex].label}`, "CONTROLES", "CRÉDITOS", `FASE LIBERADA ${save.unlockedLevel}/${LEVELS.length} // ${getLevel(this.currentLevel).name}`, "ARROWS + ENTER"], this.menuIndex);
        }
        else if (this.state === "select") {
            const data = CHARACTERS[this.selected];
            const other = this.selected === "ari" ? CHARACTERS.dax : CHARACTERS.ari;
            this.menuBoard.setText("ESCOLHA O BATEDOR", [
                `${data.name} // ${data.role.toUpperCase()}`,
                `${data.callSign}`,
                `VELOCIDADE ${"■".repeat(Math.round(data.speed / 2))}   PULSO ${"■".repeat(data.id === "ari" ? 5 : 4)}`,
                `GRANADAS ${data.grenades}   BLINDAGEM ${data.maxHealth}`,
                data.id === "ari" ? "RAJADAS CURTAS. TRÊS GRANADAS." : "PULSOS PESADOS. QUATRO GRANADAS.",
                `DIFICULDADE ${this.difficulty.toUpperCase()}   ↑/↓ ALTERA`,
                `←/→ ${other.name}   |   ENTER: PARTIR   |   ESC: VOLTAR`,
            ]);
        }
        else if (this.state === "manual") {
            this.menuBoard.setText("MANUAL DE CAMPO", [
                `${this.bindings.left.toUpperCase()}/${this.bindings.right.toUpperCase()} ou ←/→   DESLOCAR`, `${this.bindings.jump.toUpperCase()}/↑             SALTAR`, `${this.bindings.fire.toUpperCase()} / ESPAÇO      DISPARAR`,
                `${this.bindings.grenade.toUpperCase()}          GRANADA`, `${this.bindings.weapon.toUpperCase()} / 1-5        TROCAR ARMA`, `${this.bindings.down.toUpperCase()}/↓            AGACHAR / MIRAR`, `${this.bindings.interact.toUpperCase()} ROVER   |   ESC PAUSAR`,
            ]);
        }
        else if (this.state === "quality") {
            this.menuBoard.setText("OPÇÕES", [
                `GRÁFICOS        ${QUALITY_OPTIONS[this.qualityIndex].label}`,
                `VOLUME MASTER   ${Math.round(this.masterVolume * 100)}%`,
                `MÚSICA           ${Math.round(this.musicVolume * 100)}%`,
                `EFEITOS          ${Math.round(this.sfxVolume * 100)}%`,
                `DIFICULDADE      ${this.difficulty.toUpperCase()}`,
                "",
                "↑/↓ ITEM   ←/→ AJUSTA   ENTER SALVA   ESC VOLTA",
            ], this.optionsIndex);
        }
        else if (this.state === "controls") {
            const actions = this.controlActions();
            const visible = Array.from({ length: 5 }, (_, offset) => { const index = (this.controlIndex - 2 + offset + actions.length) % actions.length; return { index, item: actions[index] }; });
            const rows = visible.map(({ index, item: [id, label] }) => `${label.padEnd(12, " ")} ${this.bindings[id].toUpperCase()}${this.waitingForBinding && this.controlIndex === index ? "  <PRESSIONE UMA TECLA>" : ""}`);
            this.menuBoard.setText("CONTROLES", [...rows, "↑/↓ SELECIONA   ENTER: REMAPEAR", "ESC: VOLTAR"], 2);
        }
        else if (this.state === "credits") {
            this.menuBoard.setText("TRANSMISSÃO RECEBIDA", ["PIXEL FRONTIER", "CONCEITO, SISTEMAS E ARTE MODULAR", "UMA MISSÃO ORIGINAL DE PIXEL ART 16-BIT", "", "ENTER OU ESC PARA RETORNAR"]);
        }
        else if (this.state === "loading") {
            const level = getLevel(this.currentLevel);
            const bars = Math.max(0, Math.min(20, Math.round(this.loadingProgress * 20)));
            this.menuBoard.setText(`OPERAÇÃO ${String(level.id).padStart(2, "0")} // ${level.name}`, [
                level.operation, level.objective, "", `CARREGANDO ${"■".repeat(bars)}${"□".repeat(20 - bars)} ${Math.round(this.loadingProgress * 100)}%`, this.loadingLabel.toUpperCase(), "PREPARANDO ZONA DE COMBATE..."
            ]);
        }
        else if (this.state === "pause") {
            this.menuBoard.setText("JOGO PAUSADO", [
                `FASE ${this.currentLevel} // ${getLevel(this.currentLevel).name}`,
                `ARMA ${WEAPONS[this.weapon].label}`,
                "ESC / ENTER: CONTINUAR",
                "R: REINICIAR DO CHECKPOINT",
                "M: VOLTAR AO MENU",
            ]);
        }
        else if (this.state === "win") {
            const last = this.currentLevel >= LEVELS.length;
            this.menuBoard.setText(last ? "CAMPANHA CONCLUÍDA" : "MISSÃO CUMPRIDA", [
                `PONTUAÇÃO ${this.player.score.toString().padStart(6, "0")}`,
                `RESGATADOS ${this.player.rescued}/3   FASE ${this.currentLevel}/${LEVELS.length}`, last ? "A FORTALEZA FOI DESTRUÍDA." : `PRÓXIMA: ${getLevel(this.currentLevel + 1).name}`, "", last ? "ENTER: REINICIAR CAMPANHA    ESC: MENU" : "ENTER: PRÓXIMA FASE    ESC: MENU",
            ]);
        }
        else if (this.state === "lose") {
            this.menuBoard.setText("SINAL PERDIDO", ["A EQUIPE NÃO CONSEGUIU CRUZAR A ZONA DE EXTRAÇÃO.", `PONTUAÇÃO ${this.player.score.toString().padStart(6, "0")}`, "", "ENTER: TENTAR NOVAMENTE    ESC: MENU"]);
        }
    }
    async startMission(level = this.currentLevel, fromCheckpoint = true) {
        const previousLevel = this.currentLevel;
        this.currentLevel = Math.max(1, Math.min(LEVELS.length, level));
        if (previousLevel !== this.currentLevel)
            this.assets.releaseLevel(previousLevel);
        this.save.update({ currentLevel: this.currentLevel });
        if (!fromCheckpoint) {
            this.checkpointX = 2;
            this.save.resetCheckpoint(this.currentLevel);
        }
        this.state = "loading";
        this.loadingProgress = 0;
        this.loadingLabel = "MANIFESTO";
        this.menuBoard.visible(true);
        this.hudBoard.visible(false);
        this.bossMeter.root.setEnabled(false);
        this.previewAri.setEnabled(false);
        this.previewDax.setEnabled(false);
        this.brandMark.setEnabled(true);
        this.renderMenu();
        await this.assets.preloadLevel(this.currentLevel, (progress, label) => {
            this.loadingProgress = progress;
            this.loadingLabel = label;
            this.renderMenu();
        });
        this.resetMission();
        this.state = "play";
        this.menuBoard.visible(false);
        this.hudBoard.visible(true);
        this.brandMark.setEnabled(false);
        this.audio.playMusic();
        if (this.demoBoss) {
            this.player.x = 73;
            this.player.score = 3200;
            this.player.rescued = 3;
            this.hasRover = true;
            this.boss.active = true;
            this.bossRoot.setEnabled(true);
            this.syncPlayerVisual();
        }
        if (this.demoTerrain) {
            this.player.x = 16.5;
            this.player.y = -3.65;
            this.player.vy = 0;
            this.syncPlayerVisual();
        }
        if (this.demoSecurity) {
            this.player.x = 10.2;
            this.player.y = -5.15;
            this.player.vy = 0;
            this.syncPlayerVisual();
        }
        this.securityNotice = `${getLevel(this.currentLevel).operation}: ${getLevel(this.currentLevel).objective}`;
    }
    controlActions() { return [["left", "ESQUERDA"], ["right", "DIREITA"], ["jump", "PULAR"], ["down", "AGACHAR"], ["fire", "ATIRAR"], ["grenade", "GRANADA"], ["interact", "INTERAGIR"], ["weapon", "TROCAR ARMA"]]; }
    canonicalForRaw(key) {
        const aliases = { left: "a", right: "d", jump: "w", down: "s", fire: "x", grenade: "shift", interact: "e", weapon: "q" };
        const found = Object.entries(this.bindings).find(([, raw]) => raw === key)?.[0];
        return found ? aliases[found] : key;
    }
    handleKeyDown(rawKey) {
        const key = rawKey.toLowerCase();
        if (this.state === "controls" && this.waitingForBinding && key !== "escape") {
            const action = this.controlActions()[this.controlIndex]?.[0];
            if (action) {
                this.bindings[action] = key;
                window.localStorage.setItem("pixel-frontier-bindings", JSON.stringify(this.bindings));
            }
            this.waitingForBinding = false;
            this.audio.sfxPlay("menu");
            this.renderMenu();
            return;
        }
        if (["arrowup", "arrowdown", "arrowleft", "arrowright", "enter", "escape", "e", "q", "1", "2", "3", "4", "5", "r", "m"].includes(key) || rawKey === " ")
            this.handleAction(key, rawKey);
        this.keys.add(key);
        this.keys.add(this.canonicalForRaw(key));
    }
    handleKeyUp(rawKey) {
        const key = rawKey.toLowerCase();
        this.keys.delete(key);
        this.keys.delete(this.canonicalForRaw(key));
    }
    handleAction(key, rawKey) {
        if (this.state === "menu") {
            if (key === "arrowup" || key === "arrowdown") {
                this.menuIndex = (this.menuIndex + (key === "arrowup" ? 4 : 1)) % 5;
                this.renderMenu();
            }
            if (key === "enter" || rawKey === " ") {
                if (this.menuIndex === 0) {
                    this.state = "select";
                    this.renderMenu();
                }
                if (this.menuIndex === 1) {
                    this.state = "manual";
                    this.renderMenu();
                }
                if (this.menuIndex === 2) {
                    this.state = "quality";
                    this.optionsIndex = 0;
                    this.renderMenu();
                }
                if (this.menuIndex === 3) {
                    this.state = "controls";
                    this.controlIndex = 0;
                    this.renderMenu();
                }
                if (this.menuIndex === 4) {
                    this.state = "credits";
                    this.renderMenu();
                }
            }
            return;
        }
        if (this.state === "select") {
            if (key === "arrowleft" || key === "arrowright") {
                this.selected = this.selected === "ari" ? "dax" : "ari";
                this.renderMenu();
            }
            if (key === "arrowup" || key === "arrowdown") {
                const list = ["easy", "normal", "hard"];
                const i = list.indexOf(this.difficulty);
                this.difficulty = list[(i + (key === "arrowup" ? 2 : 1)) % list.length];
                this.save.update({ settings: { ...this.save.snapshot.settings, difficulty: this.difficulty } });
                this.renderMenu();
            }
            if (key === "enter" || rawKey === " ")
                void this.startMission(this.currentLevel, true);
            if (key === "escape")
                this.showMenu();
            return;
        }
        if (this.state === "quality") {
            if (key === "arrowup" || key === "arrowdown") {
                this.optionsIndex = (this.optionsIndex + (key === "arrowup" ? 4 : 1)) % 5;
                this.renderMenu();
            }
            if (key === "arrowleft" || key === "arrowright") {
                const dir = key === "arrowright" ? 1 : -1;
                if (this.optionsIndex === 0) {
                    this.qualityIndex = (this.qualityIndex + dir + QUALITY_OPTIONS.length) % QUALITY_OPTIONS.length;
                    this.setQuality(QUALITY_OPTIONS[this.qualityIndex].id);
                }
                else if (this.optionsIndex >= 1 && this.optionsIndex <= 3) {
                    const clamp = (v) => Math.max(0, Math.min(1, Math.round(v * 10) / 10));
                    if (this.optionsIndex === 1)
                        this.masterVolume = clamp(this.masterVolume + dir * 0.1);
                    if (this.optionsIndex === 2)
                        this.musicVolume = clamp(this.musicVolume + dir * 0.1);
                    if (this.optionsIndex === 3)
                        this.sfxVolume = clamp(this.sfxVolume + dir * 0.1);
                    this.audio.setVolumes(this.masterVolume, this.musicVolume, this.sfxVolume);
                }
                else {
                    const list = ["easy", "normal", "hard"];
                    const i = list.indexOf(this.difficulty);
                    this.difficulty = list[(i + dir + list.length) % list.length];
                }
                this.renderMenu();
            }
            if (key === "enter" || rawKey === " ") {
                this.save.update({ settings: { quality: this.quality, masterVolume: this.masterVolume, musicVolume: this.musicVolume, sfxVolume: this.sfxVolume, difficulty: this.difficulty } });
                this.audio.sfxPlay("menu");
                this.showMenu();
            }
            if (key === "escape")
                this.showMenu();
            return;
        }
        if (this.state === "controls") {
            const actions = this.controlActions();
            if (key === "arrowup" || key === "arrowdown") {
                this.controlIndex = (this.controlIndex + (key === "arrowup" ? actions.length - 1 : 1)) % actions.length;
                this.renderMenu();
            }
            if (key === "enter") {
                this.waitingForBinding = true;
                this.renderMenu();
            }
            if (key === "escape") {
                this.waitingForBinding = false;
                this.showMenu();
            }
            return;
        }
        if (["manual", "credits"].includes(this.state)) {
            if (key === "escape" || key === "enter")
                this.showMenu();
            return;
        }
        if (this.state === "win") {
            if (key === "enter" || rawKey === " ") {
                const next = this.currentLevel >= LEVELS.length ? 1 : this.currentLevel + 1;
                this.currentLevel = next;
                this.checkpointX = 2;
                this.save.unlock(next);
                void this.startMission(next, false);
            }
            if (key === "escape")
                this.showMenu();
            return;
        }
        if (this.state === "lose") {
            if (key === "enter" || rawKey === " ")
                void this.startMission(this.currentLevel, true);
            if (key === "escape")
                this.showMenu();
            return;
        }
        if (this.state === "pause") {
            if (key === "escape" || key === "enter") {
                this.state = "play";
                this.menuBoard.visible(false);
                this.hudBoard.visible(true);
            }
            if (key === "r")
                void this.startMission(this.currentLevel, true);
            if (key === "m")
                this.showMenu();
            return;
        }
        if (this.state === "play") {
            if (key === "escape") {
                this.state = "pause";
                this.menuBoard.visible(true);
                this.hudBoard.visible(false);
                this.renderMenu();
                return;
            }
            if (key === "q")
                this.cycleWeapon();
            if (["1", "2", "3", "4", "5"].includes(key))
                this.selectWeaponByIndex(Number(key) - 1);
        }
    }
    handleVirtualAction(action, pressed) {
        const map = { left: "arrowleft", right: "arrowright", jump: "w", fire: "x", grenade: "shift", interact: "e", down: "s" };
        const key = map[action];
        if (!key) {
            if (pressed && action === "pause")
                this.handleAction("escape", "Escape");
            return;
        }
        if (pressed) {
            this.keys.add(key);
            if (["e"].includes(key))
                this.handleAction(key, key);
        }
        else
            this.keys.delete(key);
    }
    availableWeapons() {
        return ["rifle", "vulcan", "shotgun", "rocket", "flame"].filter((id) => id === "rifle" || this.weaponAmmo[id] > 0);
    }
    cycleWeapon() {
        const list = this.availableWeapons();
        const index = Math.max(0, list.indexOf(this.weapon));
        this.weapon = list[(index + 1) % list.length] ?? "rifle";
        this.audio.sfxPlay("menu");
    }
    selectWeaponByIndex(index) {
        const id = ["rifle", "vulcan", "shotgun", "rocket", "flame"][index];
        if (id && (id === "rifle" || this.weaponAmmo[id] > 0)) {
            this.weapon = id;
            this.audio.sfxPlay("menu");
        }
    }
    pollGamepad() {
        if (typeof navigator === "undefined" || !navigator.getGamepads)
            return;
        const pad = Array.from(navigator.getGamepads()).find(Boolean);
        if (!pad)
            return;
        const axisX = pad.axes[0] ?? 0;
        const axisY = pad.axes[1] ?? 0;
        const setAxis = (key, on) => on ? this.keys.add(key) : this.keys.delete(key);
        setAxis("arrowleft", axisX < -0.25);
        setAxis("arrowright", axisX > 0.25);
        setAxis("arrowdown", axisY > 0.45);
        const mappings = [[0, "w"], [2, "x"], [1, "shift"], [3, "e"]];
        for (const [button, key] of mappings)
            setAxis(key, Boolean(pad.buttons[button]?.pressed));
        [8, 9].forEach((button) => {
            const pressed = Boolean(pad.buttons[button]?.pressed);
            if (pressed && !this.gamepadLatch.has(button)) {
                this.gamepadLatch.add(button);
                if (button === 9)
                    this.handleAction("escape", "Escape");
                else
                    this.cycleWeapon();
            }
            if (!pressed)
                this.gamepadLatch.delete(button);
        });
    }
    update(delta) {
        const dt = Math.min(delta, 0.035);
        this.pollGamepad();
        this.elapsed += dt;
        if (this.quality === "auto") {
            this.autoQualityTimer += dt;
            this.frameSamples.push(dt);
            if (this.frameSamples.length > 120)
                this.frameSamples.shift();
            if (this.autoQualityTimer > 3 && this.frameSamples.length > 30) {
                const avg = this.frameSamples.reduce((a, b) => a + b, 0) / this.frameSamples.length;
                this.mediumDetailRoot.setEnabled(avg < 0.030);
                this.highDetailRoot.setEnabled(avg < 0.020);
                this.autoQualityTimer = 0;
            }
        }
        this.positionUi();
        this.updateQualityDecor();
        if (this.state !== "play")
            return;
        this.updateMission(dt);
    }
    updateQualityDecor() {
        if (this.quality !== "high" && this.quality !== "auto")
            return;
        this.dustMotes.forEach((mote) => {
            mote.mesh.position.y = mote.y + Math.sin(this.elapsed * 0.72 + mote.phase) * 0.24;
            mote.mesh.position.x = mote.x + Math.cos(this.elapsed * 0.32 + mote.phase) * 0.38;
            mote.mesh.scaling.setAll(0.78 + Math.max(0, Math.sin(this.elapsed * 1.7 + mote.phase)) * 0.45);
        });
    }
    animatePart(root, tag, offsetX, offsetY) {
        const part = root.getChildMeshes().find((mesh) => mesh.name === `${root.name}-${tag}`);
        if (!part)
            return;
        const stored = part.metadata;
        const base = stored ?? { baseX: part.position.x, baseY: part.position.y };
        part.metadata = base;
        part.position.x = (base.baseX ?? 0) + offsetX;
        part.position.y = (base.baseY ?? 0) + offsetY;
    }
    setPartVisible(root, tag, visible) {
        root.getChildMeshes().find((mesh) => mesh.name === `${root.name}-${tag}`)?.setEnabled(visible);
    }
    overlaps(a, b) {
        return Math.abs(a.x - b.x) <= a.halfWidth + b.halfWidth && Math.abs(a.y - b.y) <= a.halfHeight + b.halfHeight;
    }
    projectileBox(projectile) {
        return { x: projectile.x, y: projectile.y, halfWidth: projectile.halfWidth, halfHeight: projectile.halfHeight };
    }
    enemyBox(enemy) {
        return enemy.kind === "drone"
            ? { x: enemy.x, y: enemy.root.position.y, halfWidth: 0.62, halfHeight: 0.38 }
            : { x: enemy.x, y: enemy.root.position.y + 0.08, halfWidth: 0.66, halfHeight: 0.88 };
    }
    activePlayerBox() {
        const template = this.hasRover ? this.roverHitbox : this.playerHitbox;
        return { x: this.player.x + template.x, y: this.player.y + template.y, halfWidth: template.halfWidth, halfHeight: template.halfHeight };
    }
    resetSecurityRoute() {
        this.securityNotice = "SETOR A: ABRIR BARRICADA";
        this.securitySwitches.forEach((switchNode) => {
            switchNode.activated = false;
            this.setPartVisible(switchNode.root, "lamp-off", true);
            this.setPartVisible(switchNode.root, "lamp-on", false);
            switchNode.root.scaling.setAll(1);
        });
        this.securityDoors.forEach((door) => {
            door.open = false;
            door.root.position.y = door.closedY;
            door.box.y = door.closedY;
            door.root.setEnabled(true);
        });
        this.groundTraps.forEach((trap) => {
            trap.cooldown = 0;
            trap.root.scaling.setAll(1);
        });
    }
    updateSecurityRoute(dt) {
        const activationRequested = this.keys.has("e") || (this.demoSecurity && this.demoTime > 0.45 && this.demoTime < 1.2);
        for (const switchNode of this.securitySwitches) {
            if (!switchNode.activated && activationRequested && this.overlaps(this.activePlayerBox(), switchNode.box)) {
                switchNode.activated = true;
                this.setPartVisible(switchNode.root, "lamp-off", false);
                this.setPartVisible(switchNode.root, "lamp-on", true);
                switchNode.root.scaling.setAll(1.12);
                const door = this.securityDoors.find((candidate) => candidate.id === switchNode.doorId);
                if (door) {
                    door.open = true;
                    this.securityNotice = `${switchNode.id === "console-alpha" ? "CIRCUITO A" : "CIRCUITO B"}: PORTA LIBERADA`;
                }
            }
        }
        this.securityDoors.forEach((door) => {
            if (!door.open)
                return;
            const targetY = door.closedY + 5.4;
            door.root.position.y += (targetY - door.root.position.y) * Math.min(1, dt * 6.5);
            door.box.y = door.root.position.y;
        });
        this.groundTraps.forEach((trap) => {
            trap.cooldown = Math.max(0, trap.cooldown - dt);
            const pulse = 1 + Math.max(0, Math.sin(this.elapsed * 8 + trap.box.x)) * 0.12;
            trap.root.scaling.y = pulse;
            if (trap.cooldown <= 0 && this.overlaps(this.activePlayerBox(), trap.box)) {
                trap.cooldown = 1.15;
                this.securityNotice = "ALERTA: PISO DE PULSO ATIVO";
                this.damagePlayer();
            }
        });
    }
    resolveTerrain(previousX, previousY) {
        const activeBox = this.activePlayerBox();
        const solidBoxes = [
            ...this.obstacles.filter((obstacle) => obstacle.active).map((obstacle) => obstacle.box),
            ...this.securityDoors.filter((door) => !door.open).map((door) => door.box),
        ];
        for (const box of solidBoxes) {
            if (!this.overlaps(activeBox, box))
                continue;
            const cameFromLeft = previousX + activeBox.halfWidth <= box.x;
            const cameFromRight = previousX - activeBox.halfWidth >= box.x;
            if (cameFromLeft)
                this.player.x = box.x - box.halfWidth - activeBox.halfWidth - 0.02;
            else if (cameFromRight)
                this.player.x = box.x + box.halfWidth + activeBox.halfWidth + 0.02;
            else if (this.player.x < box.x)
                this.player.x = box.x - box.halfWidth - activeBox.halfWidth - 0.02;
            else
                this.player.x = box.x + box.halfWidth + activeBox.halfWidth + 0.02;
        }
        if (this.player.vy <= 0) {
            const landing = this.surfaces
                .filter((surface) => Math.abs(this.player.x - surface.x) <= surface.halfWidth - activeBox.halfWidth * 0.45 && previousY >= surface.landY - 0.03 && this.player.y <= surface.landY)
                .sort((a, b) => b.landY - a.landY)[0];
            if (landing) {
                this.player.y = landing.landY;
                this.player.vy = 0;
            }
        }
        if (this.player.y < -5.15) {
            this.player.y = -5.15;
            this.player.vy = 0;
        }
    }
    fireCurrentWeapon(data) {
        const spec = WEAPONS[this.weapon];
        const ammo = this.weaponAmmo[this.weapon];
        if (this.weapon !== "rifle" && ammo <= 0) {
            this.weapon = "rifle";
            return;
        }
        const muzzleX = this.player.x + this.player.dir * (this.hasRover ? 1.8 : 0.85);
        const muzzleY = this.player.y + (this.crouching ? 0.12 : 0.44);
        const aim = this.aimY;
        if (this.hasRover) {
            this.spawnProjectile(muzzleX, muzzleY, this.player.dir * 24, aim * 7, true, 2, false);
            this.fireTimer = 0.12;
            this.audio.sfxPlay("heavy");
        }
        else if (this.weapon === "shotgun") {
            for (let i = -2; i <= 2; i += 1)
                this.spawnProjectile(muzzleX, muzzleY, this.player.dir * spec.speed, aim * 6 + i * 1.2, true, spec.damage, false);
            this.fireTimer = spec.fireRate;
            this.audio.sfxPlay("shotgun");
        }
        else {
            this.spawnProjectile(muzzleX, muzzleY, this.player.dir * spec.speed, aim * (this.weapon === "rocket" ? 4 : 7), true, spec.damage, spec.burst);
            this.fireTimer = this.weapon === "rifle" ? data.fireRate : spec.fireRate;
            this.audio.sfxPlay(this.weapon === "rocket" ? "rocket" : this.weapon === "vulcan" ? "heavy" : this.weapon === "flame" ? "heavy" : "shoot");
        }
        if (this.weapon !== "rifle") {
            this.weaponAmmo[this.weapon] = Math.max(0, this.weaponAmmo[this.weapon] - 1);
            if (this.weaponAmmo[this.weapon] <= 0)
                this.weapon = "rifle";
        }
        this.shotFlash = 0.10;
        this.spawnCombatFx(this.player.x + this.player.dir * (this.hasRover ? 2.05 : 1.55), muzzleY, "hit");
    }
    updateMission(dt) {
        this.demoTime += dt;
        const data = CHARACTERS[this.selected];
        const demoMove = this.isDemo && !this.demoTerrain && (this.demoSecurity ? this.demoTime > 1.25 && this.demoTime < 4.2 : this.demoTime < 12);
        const moveLeft = this.keys.has("a") || this.keys.has("arrowleft");
        const moveRight = this.keys.has("d") || this.keys.has("arrowright") || demoMove;
        const jump = this.keys.has("w") || this.keys.has("arrowup");
        this.crouching = (this.keys.has("s") || this.keys.has("arrowdown")) && this.player.vy === 0 && !this.hasRover;
        this.aimY = jump && (this.keys.has("x") || this.keys.has(" ")) ? 1 : this.crouching ? -0.35 : 0;
        const fire = this.keys.has("x") || this.keys.has(" ") || (this.isDemo && this.demoTime > 1.2);
        const grenade = this.keys.has("shift") || (this.isDemo && this.demoTime > 4.8 && this.demoTime < 5.1);
        const nearRover = !this.hasRover && this.overlaps(this.activePlayerBox(), { x: this.roverRoot.position.x, y: this.roverRoot.position.y - 0.28, halfWidth: 1.80, halfHeight: 0.92 });
        if ((this.keys.has("e") || (this.isDemo && this.player.x > 34)) && nearRover)
            this.hasRover = true;
        const previousX = this.player.x;
        const previousY = this.player.y;
        let speed = data.speed * (this.hasRover ? 0.92 : this.crouching ? 0.42 : 1);
        if (moveLeft) {
            this.player.x -= speed * dt;
            this.player.dir = -1;
        }
        if (moveRight) {
            this.player.x += speed * dt;
            this.player.dir = 1;
        }
        this.player.x = Math.max(1, Math.min(this.player.x, 91));
        if (jump && !this.crouching && this.player.vy === 0)
            this.player.vy = 11.5;
        this.player.vy -= 27 * dt;
        this.player.y += this.player.vy * dt;
        this.resolveTerrain(previousX, previousY);
        this.fireTimer -= dt;
        this.grenadeTimer -= dt;
        this.shotFlash = Math.max(0, this.shotFlash - dt);
        if (fire && this.fireTimer <= 0)
            this.fireCurrentWeapon(data);
        if (grenade && this.player.grenades > 0 && this.grenadeTimer <= 0) {
            this.player.grenades -= 1;
            this.spawnProjectile(this.player.x + this.player.dir * 0.8, this.player.y + 0.8, this.player.dir * 11, 8.5, true, 5, true);
            this.audio.sfxPlay("grenade");
            this.grenadeTimer = 0.8;
        }
        this.player.invincible = Math.max(0, this.player.invincible - dt);
        this.updateSecurityRoute(dt);
        this.syncPlayerVisual();
        this.updateMissionVehicles(dt);
        this.updateEnemies(dt);
        this.updateProjectiles(dt);
        this.updateCombatFx(dt);
        this.updateRescues();
        this.updateWeaponPickups();
        this.updateCheckpoint();
        this.updateBoss(dt);
        this.updateHud(dt);
    }
    syncPlayerVisual() {
        this.playerRoot.position.set(this.player.x, this.player.y, 0);
        const moving = this.keys.has("a") || this.keys.has("d") || this.keys.has("arrowleft") || this.keys.has("arrowright") || (this.isDemo && this.demoTime < 12);
        const stride = moving && this.player.vy === 0 ? Math.sin(this.elapsed * 16) : 0;
        const jumping = this.player.y > -5.13;
        const damagePulse = this.player.invincible > 0 ? (Math.floor(this.elapsed * 20) % 2 === 0 ? 1 : 0.86) : 1;
        this.playerRoot.scaling.x = this.player.dir * damagePulse;
        this.playerRoot.scaling.y = jumping ? 1.06 : this.crouching ? 0.78 : damagePulse;
        this.playerRoot.setEnabled(!this.hasRover && (this.player.invincible <= 0 || Math.floor(this.elapsed * 18) % 2 === 0));
        const playerFrame = jumping ? 6 : this.shotFlash > 0 ? 7 : this.crouching ? 1 : moving ? 2 + (Math.floor(this.elapsed * 12) % 4) : Math.floor(this.elapsed * 2.4) % 2;
        setAssetFrame(this.playerRoot, playerFrame);
        this.animatePart(this.playerRoot, "leg-front", 0, stride * 0.13 - (jumping ? 0.12 : 0));
        this.animatePart(this.playerRoot, "leg-back", 0, -stride * 0.13 + (jumping ? 0.10 : 0));
        this.animatePart(this.playerRoot, "boot-front", stride * 0.08, stride * 0.06 - (jumping ? 0.12 : 0));
        this.animatePart(this.playerRoot, "boot-back", -stride * 0.08, -stride * 0.06 + (jumping ? 0.10 : 0));
        this.setPartVisible(this.playerRoot, "muzzle", this.shotFlash > 0 && !this.hasRover);
        this.setPartVisible(this.roverRoot, "muzzle", this.shotFlash > 0 && this.hasRover);
        if (this.hasRover) {
            this.roverRoot.position.set(this.player.x, this.player.y - 0.05, 0.1);
            this.roverRoot.setEnabled(true);
            this.animatePart(this.roverRoot, "wheel-left", 0, Math.sin(this.elapsed * 18) * 0.10);
            this.animatePart(this.roverRoot, "wheel-right", 0, -Math.sin(this.elapsed * 18) * 0.10);
        }
        else
            this.roverRoot.position.x = 36;
        const bounce = this.player.vy !== 0 ? 0.08 : Math.sin(this.elapsed * 10) * 0.03;
        this.playerRoot.position.y += bounce;
    }
    updateEnemies(dt) {
        for (const enemy of this.enemies) {
            if (!enemy.alive)
                continue;
            if (!enemy.active) {
                if (this.player.x < enemy.triggerX)
                    continue;
                enemy.active = true;
                enemy.root.setEnabled(true);
                this.spawnCombatFx(enemy.entryX + 1.4, enemy.kind === "drone" ? enemy.y : -4.9, "smoke");
            }
            enemy.cooldown -= dt;
            if (enemy.entering) {
                if (enemy.kind === "drone") {
                    enemy.x += (enemy.entryX - enemy.x) * Math.min(1, dt * 4.5);
                    enemy.root.position.x = enemy.x;
                    enemy.root.position.y += (enemy.y - enemy.root.position.y) * Math.min(1, dt * 3.4);
                    if (Math.abs(enemy.root.position.y - enemy.y) < 0.15 && Math.abs(enemy.x - enemy.entryX) < 0.18)
                        enemy.entering = false;
                }
                else {
                    const dx = enemy.entryX - enemy.x;
                    enemy.x += Math.sign(dx) * Math.min(Math.abs(dx), dt * 4.8);
                    enemy.root.position.x = enemy.x;
                    enemy.root.scaling.x = -1;
                    setAssetFrame(enemy.root, 1 + (Math.floor(this.elapsed * 12 + enemy.drift) % 4));
                    if (Math.abs(dx) < 0.2)
                        enemy.entering = false;
                }
                continue;
            }
            if (enemy.kind === "drone") {
                enemy.root.position.y = enemy.y + Math.sin(this.elapsed * 2.2 + enemy.drift) * 0.42;
                enemy.root.rotation.z = Math.sin(this.elapsed * 3.1 + enemy.drift) * 0.08;
                this.animatePart(enemy.root, "wing-left", 0, Math.sin(this.elapsed * 9 + enemy.drift) * 0.08);
                this.animatePart(enemy.root, "wing-right", 0, -Math.sin(this.elapsed * 9 + enemy.drift) * 0.08);
            }
            const distance = this.player.x - enemy.x;
            if (enemy.kind === "sentry" && Math.abs(distance) < 10 && Math.abs(distance) > 4.2) {
                enemy.x += Math.sign(distance) * dt * 0.92;
                enemy.root.position.x = enemy.x;
                enemy.root.scaling.x = Math.sign(distance);
            }
            if (enemy.kind === "sentry") {
                const running = Math.abs(distance) < 10 && Math.abs(distance) > 4.2;
                const frame = enemy.cooldown < 0.16 ? 5 : running ? 1 + (Math.floor(this.elapsed * 10 + enemy.drift * 2) % 4) : 0;
                setAssetFrame(enemy.root, frame);
            }
            if (enemy.cooldown <= 0 && Math.abs(enemy.x - this.player.x) < 13) {
                const direction = this.player.x < enemy.x ? -1 : 1;
                this.spawnProjectile(enemy.x + direction * 0.82, enemy.root.position.y + 0.25, direction * (enemy.kind === "drone" ? 10 : 8.6), 0, false, 1, false);
                this.spawnCombatFx(enemy.x + direction * 0.92, enemy.root.position.y + 0.25, "hit");
                enemy.cooldown = enemy.kind === "drone" ? 1.35 : 1.55;
            }
        }
    }
    updateRescues() {
        for (const rescue of this.rescues) {
            const rescueBox = { x: rescue.x, y: rescue.root.position.y, halfWidth: 0.40, halfHeight: 0.84 };
            if (rescue.active && this.overlaps(this.activePlayerBox(), rescueBox)) {
                rescue.active = false;
                rescue.root.setEnabled(false);
                this.player.rescued += 1;
                this.player.score += 1000;
            }
        }
    }
    updateBoss(dt) {
        if (!this.boss.active && this.player.x > 68) {
            this.boss.active = true;
            this.bossRoot.setEnabled(true);
            this.audio.sfxPlay("boss");
            this.securityNotice = `BOSS: ${getLevel(this.currentLevel).bossName}`;
        }
        if (!this.boss.active)
            return;
        const ratio = this.boss.hp / Math.max(1, this.boss.maxHp);
        const phase = ratio > 0.70 ? 1 : ratio > 0.40 ? 2 : ratio > 0.15 ? 3 : 4;
        const baseY = -4.68 + Math.sin(this.elapsed * (1.6 + phase * 0.18)) * 0.12;
        this.bossRoot.position.y = baseY;
        if (phase >= 2)
            this.bossRoot.position.x = 84 + Math.sin(this.elapsed * 0.65) * (phase === 4 ? 2.0 : 1.0);
        const warningPulse = 1 + Math.max(0, Math.sin(this.elapsed * (5.2 + phase))) * (0.025 + phase * 0.008);
        this.bossRoot.scaling.setAll(warningPulse);
        const bossFrame = ratio < 0.25 ? 5 : ratio < 0.55 ? 4 : this.boss.cooldown < 0.22 ? 3 : Math.floor(this.elapsed * 2.2) % 3;
        setAssetFrame(this.bossRoot, bossFrame);
        this.boss.cooldown -= dt;
        if (!this.bossPhaseSpawned.has(phase)) {
            this.bossPhaseSpawned.add(phase);
            if (phase === 2) {
                this.spawnReinforcementSoldier(78.5, "boss2a");
                this.spawnReinforcementSoldier(80.0, "boss2b");
            }
            if (phase === 3) {
                this.spawnCombatFx(84, -3.8, "smoke");
                this.spawnReinforcementSoldier(77.5, "boss3a");
            }
            if (phase === 4) {
                this.spawnCombatFx(83.4, -4.0, "explosion");
                this.cameraShake = 0.28;
            }
        }
        if (this.boss.cooldown <= 0) {
            const direction = this.player.x < this.bossRoot.position.x ? -1 : 1;
            if (phase === 1) {
                this.spawnProjectile(this.bossRoot.position.x + direction * -2.2, -4.5, direction * 9, 0.8, false, 1, false);
                this.boss.cooldown = 1.15;
            }
            else if (phase === 2) {
                this.spawnProjectile(this.bossRoot.position.x - 2.2, -4.15, direction * 8.5, 5.4, false, 1, true);
                this.spawnProjectile(this.bossRoot.position.x - 1.4, -4.05, direction * 9.2, 6.4, false, 1, true);
                this.boss.cooldown = 1.45;
            }
            else if (phase === 3) {
                for (let i = -1; i <= 1; i += 1)
                    this.spawnProjectile(this.bossRoot.position.x - 2.1, -4.45 + i * 0.35, direction * (10 + i), i * 1.1, false, 1, false);
                this.boss.cooldown = 0.82;
            }
            else {
                this.spawnProjectile(this.bossRoot.position.x - 2.1, -4.3, direction * 12, Math.sin(this.elapsed * 4) * 2.4, false, 1, false);
                if (Math.floor(this.elapsed * 2) % 2 === 0)
                    this.spawnProjectile(this.bossRoot.position.x - 1.8, -3.9, direction * 9, 6.8, false, 1, true);
                this.boss.cooldown = 0.46;
            }
        }
    }
    spawnCombatFx(x, y, kind) {
        const id = Math.random().toString(36).slice(2);
        const root = kind === "explosion"
            ? assetSheetSprite(this.scene, `explosion-${id}`, `./assets/explosion_sheet.png`, 10, 2.45, 2.45, -1.2)
            : kind === "hit"
                ? sprite(this.scene, `hit-${id}`, [
                    { tag: "spark-a", x: 0, y: 0, width: 0.16, height: 0.72, color: "#f7d36c" },
                    { tag: "spark-b", x: 0, y: 0, width: 0.72, height: 0.16, color: "#f08a2e" },
                    { tag: "spark-c", x: 0.22, y: 0.22, width: 0.26, height: 0.26, color: "#fff1b0" },
                ], -1.15)
                : sprite(this.scene, `smoke-${id}`, [
                    { tag: "smoke-a", x: -0.20, y: 0, width: 0.62, height: 0.62, color: "#5d5b57" },
                    { tag: "smoke-b", x: 0.25, y: 0.18, width: 0.78, height: 0.78, color: "#77736d" },
                ], -1.1);
        root.parent = this.worldRoot;
        root.position.set(x, y, 0);
        const maxLife = kind === "explosion" ? 0.48 : kind === "hit" ? 0.18 : 0.75;
        if (kind === "explosion")
            this.cameraShake = Math.min(0.34, this.cameraShake + 0.14);
        this.combatFx.push({ root, life: maxLife, maxLife, kind });
    }
    updateCombatFx(dt) {
        const alive = [];
        for (const fx of this.combatFx) {
            fx.life -= dt;
            const progress = 1 - fx.life / fx.maxLife;
            if (fx.kind === "explosion") {
                setAssetFrame(fx.root, Math.min(9, Math.floor(progress * 10)));
                fx.root.scaling.setAll(0.70 + Math.sin(Math.min(1, progress) * Math.PI) * 0.62);
            }
            else if (fx.kind === "hit") {
                fx.root.scaling.setAll(0.7 + progress * 0.8);
                fx.root.rotation.z += dt * 7;
            }
            else {
                fx.root.position.y += dt * 1.4;
                fx.root.scaling.setAll(0.7 + progress * 1.1);
            }
            if (fx.life <= 0)
                fx.root.dispose();
            else
                alive.push(fx);
        }
        this.combatFx = alive;
    }
    acquireProjectileMesh(style, x, y, ally, burst) {
        const index = this.projectilePool.findIndex((mesh) => mesh.metadata?.poolStyle === style);
        if (index >= 0) {
            const mesh = this.projectilePool.splice(index, 1)[0];
            mesh.setEnabled(true);
            mesh.position.set(x, y, -0.9);
            mesh.scaling.setAll(1);
            return mesh;
        }
        const mesh = rect(this.scene, `bullet-${Math.random().toString(36).slice(2)}`, 0.42, burst ? 0.42 : 0.10, ally ? (burst ? "#f2c45f" : "#fff1b0") : "#e85b32", this.worldRoot, x, y, -0.9);
        mesh.metadata = { ...(mesh.metadata ?? {}), poolStyle: style };
        return mesh;
    }
    releaseProjectileMesh(mesh) {
        mesh.setEnabled(false);
        mesh.scaling.setAll(1);
        this.projectilePool.push(mesh);
    }
    spawnProjectile(x, y, vx, vy, ally, damage, burst) {
        const style = `${ally ? "ally" : "enemy"}-${burst ? "burst" : "bullet"}`;
        const mesh = this.acquireProjectileMesh(style, x, y, ally, burst);
        this.projectiles.push({ mesh, x, y, vx, vy, life: burst ? 1.45 : 1.8, ally, damage, burst, halfWidth: burst ? 0.64 : 0.18, halfHeight: burst ? 0.64 : 0.12, hitTargets: new Set() });
    }
    updateProjectiles(dt) {
        const survivors = [];
        for (const projectile of this.projectiles) {
            projectile.life -= dt;
            projectile.vy -= projectile.burst ? 14 * dt : 0;
            projectile.x += projectile.vx * dt;
            projectile.y += projectile.vy * dt;
            projectile.mesh.position.set(projectile.x, projectile.y, -0.9);
            if (projectile.burst)
                projectile.mesh.scaling.setAll(1 + (1.4 - projectile.life) * 0.45);
            let consumed = projectile.life <= 0 || projectile.y < -5.75;
            for (const door of this.securityDoors) {
                if (!door.open && this.overlaps(this.projectileBox(projectile), door.box)) {
                    consumed = true;
                    break;
                }
            }
            for (const obstacle of this.obstacles) {
                if (!obstacle.active || !this.overlaps(this.projectileBox(projectile), obstacle.box))
                    continue;
                if (projectile.ally && obstacle.destructible && !projectile.hitTargets.has(obstacle.id)) {
                    projectile.hitTargets.add(obstacle.id);
                    obstacle.hp -= projectile.damage;
                    obstacle.root.scaling.setAll(obstacle.hp > 0 ? 0.92 : 1);
                    this.spawnCombatFx(projectile.x, projectile.y, "hit");
                    if (obstacle.hp <= 0) {
                        obstacle.active = false;
                        obstacle.root.setEnabled(false);
                        this.spawnCombatFx(obstacle.box.x, obstacle.box.y, "explosion");
                        this.spawnCombatFx(obstacle.box.x + 0.25, obstacle.box.y + 0.55, "smoke");
                        this.player.score += 700;
                    }
                }
                consumed = true;
                break;
            }
            if (projectile.ally) {
                for (const enemy of this.enemies) {
                    if (!enemy.alive)
                        continue;
                    const enemyKey = enemy.root.name;
                    if (!projectile.hitTargets.has(enemyKey) && this.overlaps(this.projectileBox(projectile), this.enemyBox(enemy))) {
                        projectile.hitTargets.add(enemyKey);
                        enemy.hp -= projectile.damage;
                        this.spawnCombatFx(projectile.x, projectile.y, "hit");
                        consumed = !projectile.burst;
                        if (enemy.hp <= 0) {
                            enemy.alive = false;
                            enemy.root.setEnabled(false);
                            this.spawnCombatFx(enemy.x, enemy.root.position.y, "explosion");
                            this.spawnCombatFx(enemy.x, enemy.root.position.y + 0.55, "smoke");
                            this.player.score += enemy.kind === "drone" ? 300 : 500;
                        }
                    }
                }
                const bossBox = { ...this.bossHitbox, y: this.bossRoot.position.y + 0.22, halfWidth: 2.32, halfHeight: 0.96 };
                if (this.boss.active && !projectile.hitTargets.has("argo-core") && this.overlaps(this.projectileBox(projectile), bossBox)) {
                    projectile.hitTargets.add("argo-core");
                    this.boss.hp -= projectile.damage;
                    this.spawnCombatFx(projectile.x, projectile.y, "hit");
                    if (this.boss.hp < this.boss.maxHp * 0.55) {
                        this.setPartVisible(this.bossRoot, "smoke-a", true);
                        this.setPartVisible(this.bossRoot, "smoke-b", true);
                    }
                    consumed = !projectile.burst;
                    if (this.boss.hp <= 0) {
                        this.boss.hp = 0;
                        this.spawnCombatFx(84, -4.0, "explosion");
                        this.spawnCombatFx(82.6, -4.6, "explosion");
                        this.spawnCombatFx(85.4, -3.8, "explosion");
                        this.player.score += 5000;
                        this.finish("win");
                    }
                }
            }
            else if (this.overlaps(this.projectileBox(projectile), this.activePlayerBox())) {
                consumed = true;
                this.damagePlayer();
            }
            if (consumed)
                this.releaseProjectileMesh(projectile.mesh);
            else
                survivors.push(projectile);
        }
        this.projectiles = survivors;
    }
    damagePlayer() {
        if (this.player.invincible > 0)
            return;
        this.player.invincible = 1.05;
        this.audio.sfxPlay("hit");
        if (this.hasRover) {
            this.roverHp -= 1;
            if (this.roverHp <= 0) {
                this.spawnCombatFx(this.player.x, this.player.y, "explosion");
                this.spawnCombatFx(this.player.x + 0.8, this.player.y + 0.4, "smoke");
                this.audio.sfxPlay("explosion");
                this.hasRover = false;
                this.roverRoot.setEnabled(false);
                this.roverHp = 0;
            }
            return;
        }
        this.player.health -= 1;
        if (this.player.health <= 0)
            this.finish("lose");
    }
    finish(result) {
        this.state = result;
        this.audio.stopMusic();
        this.save.recordScore(this.currentLevel, this.player.score);
        if (result === "win") {
            this.audio.sfxPlay("boss");
            const next = Math.min(LEVELS.length, this.currentLevel + 1);
            this.save.unlock(next);
        }
        this.menuBoard.visible(true);
        this.hudBoard.visible(false);
        this.bossMeter.root.setEnabled(false);
        this.renderMenu();
    }
    updateHud(dt) {
        this.dirtyHud -= dt;
        if (this.dirtyHud > 0)
            return;
        this.dirtyHud = 0.09;
        const data = CHARACTERS[this.selected];
        const ammo = this.weapon === "rifle" ? "∞" : String(this.weaponAmmo[this.weapon]);
        const rover = this.hasRover ? `   ROVER ${Math.max(0, this.roverHp)}/12` : "";
        this.hudBoard.setText(`${getLevel(this.currentLevel).operation} // F${this.currentLevel}`, [
            `VITAL ${"■".repeat(Math.max(0, Math.ceil(this.player.health)))}${"□".repeat(Math.max(0, data.maxHealth - Math.ceil(this.player.health)))}   ${WEAPONS[this.weapon].label} ${ammo}   G ${this.player.grenades}${rover}`,
            `PONTOS ${this.player.score.toString().padStart(6, "0")}   ${this.securityNotice}   Q:${QUALITY_OPTIONS[this.qualityIndex].label}`,
        ]);
        this.bossMeter.root.setEnabled(this.boss.active);
        this.bossMeter.fill.scaling.x = Math.max(0, this.boss.hp / this.boss.maxHp);
    }
    positionUi() {
        const desired = Math.max(0, Math.min(this.player.x - 2.8, 75));
        const shakeX = this.cameraShake > 0 ? Math.sin(this.elapsed * 92) * this.cameraShake : 0;
        const shakeY = this.cameraShake > 0 ? Math.cos(this.elapsed * 117) * this.cameraShake * 0.65 : 0;
        this.cameraShake = Math.max(0, this.cameraShake - 0.018);
        this.camera.position.x += (desired - this.camera.position.x) * 0.08;
        this.camera.position.y = shakeY;
        this.camera.position.x += shakeX;
        this.camera.setTarget(this.camera.position.add(new Vector3(0, 0, 10)));
        this.uiRoot.position.x = this.camera.position.x;
        this.menuBoard.root.position.x = 0;
        this.menuBoard.root.position.y = 0.1;
        this.hudBoard.root.position.x = -8.3;
        this.hudBoard.root.position.y = 6.2;
        this.bossMeter.root.position.x = 5.6;
        this.bossMeter.root.position.y = 6.5;
    }
    dispose() {
        this.projectiles.forEach((projectile) => projectile.mesh.dispose());
        this.projectilePool.forEach((mesh) => mesh.dispose());
        this.combatFx.forEach((fx) => fx.root.dispose());
        this.weaponPickups.forEach((pickup) => pickup.root.dispose());
        this.audio.dispose();
        this.worldRoot.dispose();
        this.uiRoot.dispose();
    }
}
