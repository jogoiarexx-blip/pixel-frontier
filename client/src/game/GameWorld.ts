// Fronteira de Cobre: mundo run-and-gun original, com estado explícito e UI no canvas.

import type { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { attackHelicopterSprite, bossSprite, droneSprite, enemyJeepSprite, explorerSprite, rescueSprite, roverSprite, sentrySprite } from "./entities";
import { assetSheetSprite, meter, rect, setAssetFrame, sprite, textBoard, type TextBoard } from "./pixelArt";
import { CHARACTERS, QUALITY_OPTIONS, type CharacterId, type CharacterData, type GameState, type Hitbox, type QualityLevel } from "./types";

type EnemyKind = "sentry" | "drone";

interface Enemy {
  root: TransformNode;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  cooldown: number;
  kind: EnemyKind;
  drift: number;
  alive: boolean;
  active: boolean;
  triggerX: number;
  entryX: number;
  entering: boolean;
}


interface MissionVehicle {
  kind: "jeep" | "helicopter";
  root: TransformNode;
  triggerX: number;
  targetX: number;
  active: boolean;
  completed: boolean;
  spawned: boolean;
  cooldown: number;
}

interface Rescue {
  root: TransformNode;
  x: number;
  active: boolean;
}

interface Projectile {
  mesh: AbstractMesh;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  ally: boolean;
  damage: number;
  burst: boolean;
  halfWidth: number;
  halfHeight: number;
  hitTargets: Set<string>;
}

interface CombatFx {
  root: TransformNode;
  life: number;
  maxLife: number;
  kind: "hit" | "explosion" | "smoke";
}

interface TerrainSurface {
  id: string;
  x: number;
  halfWidth: number;
  landY: number;
}

interface TerrainObstacle {
  id: string;
  root: TransformNode;
  box: Hitbox;
  hp: number;
  destructible: boolean;
  active: boolean;
}

interface SecuritySwitch {
  id: string;
  doorId: string;
  root: TransformNode;
  box: Hitbox;
  activated: boolean;
}

interface SecurityDoor {
  id: string;
  root: TransformNode;
  box: Hitbox;
  closedY: number;
  open: boolean;
}

interface GroundTrap {
  id: string;
  root: TransformNode;
  box: Hitbox;
  cooldown: number;
}

export class GameWorld {
  private readonly worldRoot: TransformNode;
  private readonly uiRoot: TransformNode;
  private playerRoot: TransformNode;
  private readonly roverRoot: TransformNode;
  private readonly bossRoot: TransformNode;
  private readonly menuBoard: TextBoard;
  private readonly hudBoard: TextBoard;
  private readonly previewAri: TransformNode;
  private readonly previewDax: TransformNode;
  private readonly brandMark: TransformNode;
  private readonly bossMeter;
  private readonly mediumDetailRoot: TransformNode;
  private readonly highDetailRoot: TransformNode;
  private readonly dustMotes: Array<{ mesh: AbstractMesh; x: number; y: number; phase: number }> = [];
  private state: GameState = "menu";
  private selected: CharacterId = "ari";
  private menuIndex = 0;
  private qualityIndex = 2;
  private quality: QualityLevel = "high";
  private keys = new Set<string>();
  private projectiles: Projectile[] = [];
  private combatFx: CombatFx[] = [];
  private enemies: Enemy[] = [];
  private rescues: Rescue[] = [];
  private missionVehicles: MissionVehicle[] = [];
  private readonly surfaces: TerrainSurface[] = [];
  private readonly obstacles: TerrainObstacle[] = [];
  private readonly securitySwitches: SecuritySwitch[] = [];
  private readonly securityDoors: SecurityDoor[] = [];
  private readonly groundTraps: GroundTrap[] = [];
  private player: { x: number; y: number; vy: number; dir: number; health: number; grenades: number; score: number; rescued: number; invincible: number; inRover: boolean } = {
    x: 2, y: -5.15, vy: 0, dir: 1, health: 4, grenades: 3, score: 0, rescued: 0, invincible: 0, inRover: false,
  };
  private boss = { active: false, hp: 36, maxHp: 36, cooldown: 1.5, direction: -1 };
  private fireTimer = 0;
  private grenadeTimer = 0;
  private elapsed = 0;
  private demoTime = 0;
  private hasRover = false;
  private dirtyHud = 0;
  private shotFlash = 0;
  private cameraShake = 0;
  private securityNotice = "SETOR A: ABRIR BARRICADA";
  private readonly playerHitbox: Hitbox = { x: 0, y: 0.74, halfWidth: 0.42, halfHeight: 0.78 };
  private readonly roverHitbox: Hitbox = { x: 0, y: 0.18, halfWidth: 1.58, halfHeight: 0.72 };
  private readonly bossHitbox: Hitbox = { x: 84, y: -4.46, halfWidth: 2.55, halfHeight: 1.00 };
  private readonly isDemo: boolean;
  private readonly demoBoss: boolean;
  private readonly demoTerrain: boolean;
  private readonly demoSecurity: boolean;

  constructor(private readonly scene: Scene, private readonly camera: FreeCamera, demoMode = "", debugScreen = "", qualityOverride = "") {
    this.isDemo = demoMode.length > 0;
    this.demoBoss = demoMode === "boss";
    this.demoTerrain = demoMode === "terrain";
    this.demoSecurity = demoMode === "security";
    const savedQuality = typeof window !== "undefined" ? window.localStorage.getItem("pixel-frontier-quality") : null;
    const candidate = qualityOverride || savedQuality || "high";
    this.quality = candidate === "low" || candidate === "medium" || candidate === "high" ? candidate : "high";
    this.qualityIndex = QUALITY_OPTIONS.findIndex((option) => option.id === this.quality);
    this.worldRoot = new TransformNode("world-root", scene);
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
    if (this.demoBoss) this.startMission();
    else if (this.isDemo) window.setTimeout(() => this.startMission(), 500);
  }

  private buildEnvironment() {
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
      if (i % 2 === 0) rect(this.scene, `ground-rubble-${i}`, 0.72, 0.24, "#4e493f", this.mediumDetailRoot, x + 1.1, -5.88, 2.45);
      if (i % 5 === 0) rect(this.scene, `ground-crater-${i}`, 1.18, 0.20, "#403c35", this.mediumDetailRoot, x - 0.8, -5.90, 2.42);
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

  private buildInteractiveTerrain() {
    const platformSpecs: Array<[string, number, number, number]> = [
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

    const obstacleSpecs: Array<{ id: string; x: number; y: number; width: number; height: number; hp: number; destructible: boolean; accent: string }> = [
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
      this.obstacles.push({ id: spec.id, root, box: { x: spec.x, y: spec.y, halfWidth: spec.width / 2, halfHeight: spec.height / 2 }, hp: spec.hp, destructible: spec.destructible, active: true });
    });
  }

  private buildSecurityRoute() {
    const switchSpecs: Array<{ id: string; doorId: string; x: number; y: number; accent: string }> = [
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

    const doorSpecs: Array<{ id: string; x: number; accent: string }> = [
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

  private applyQuality() {
    this.mediumDetailRoot.setEnabled(this.quality === "medium" || this.quality === "high");
    this.highDetailRoot.setEnabled(this.quality === "high");
  }

  private setQuality(next: QualityLevel) {
    this.quality = next;
    this.qualityIndex = QUALITY_OPTIONS.findIndex((option) => option.id === next);
    window.localStorage.setItem("pixel-frontier-quality", next);
    this.applyQuality();
  }

  private createMissionActors() {
    this.enemies.forEach((enemy) => enemy.root.dispose());
    this.rescues.forEach((rescue) => rescue.root.dispose());
    this.missionVehicles.forEach((vehicle) => vehicle.root.dispose());
    this.enemies = [];
    this.rescues = [];
    this.missionVehicles = [];

    // Ondas de combate: os soldados entram quando o jogador alcança cada setor.
    const specs: Array<[EnemyKind, number, number, number, number]> = [
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
      this.enemies.push({ root, x: startX, y, hp: 2, maxHp: 2, cooldown: 0.7 + index * 0.14, kind, drift: index * 1.2, alive: true, active: false, triggerX, entryX, entering: true });
    });

    [10, 28, 52].forEach((x, index) => {
      const root = rescueSprite(this.scene, `rescue-${index}`);
      root.parent = this.worldRoot;
      root.position.set(x, -5.15, 0);
      this.rescues.push({ root, x, active: true });
    });

    const jeepA = enemyJeepSprite(this.scene, "reinforcement-jeep-a");
    jeepA.parent = this.worldRoot; jeepA.position.set(39, -5.10, 0); jeepA.setEnabled(false);
    this.missionVehicles.push({ kind: "jeep", root: jeepA, triggerX: 22.5, targetX: 31.5, active: false, completed: false, spawned: false, cooldown: 0 });

    const heli = attackHelicopterSprite(this.scene, "attack-helicopter-a");
    heli.parent = this.worldRoot; heli.position.set(61, 3.7, 0); heli.setEnabled(false);
    this.missionVehicles.push({ kind: "helicopter", root: heli, triggerX: 40.5, targetX: 50.0, active: false, completed: false, spawned: false, cooldown: 0.35 });

    const jeepB = enemyJeepSprite(this.scene, "reinforcement-jeep-b");
    jeepB.parent = this.worldRoot; jeepB.position.set(77, -5.10, 0); jeepB.setEnabled(false);
    this.missionVehicles.push({ kind: "jeep", root: jeepB, triggerX: 57.5, targetX: 67.5, active: false, completed: false, spawned: false, cooldown: 0 });
  }

  private spawnReinforcementSoldier(x: number, label: string) {
    const root = sentrySprite(this.scene, `reinforcement-${label}-${Math.random().toString(36).slice(2)}`);
    root.parent = this.worldRoot;
    root.position.set(x, -5.15, 0);
    this.enemies.push({ root, x, y: -5.15, hp: 2, maxHp: 2, cooldown: 0.5 + Math.random() * 0.7, kind: "sentry", drift: Math.random() * 5, alive: true, active: true, triggerX: -1, entryX: x, entering: false });
  }

  private updateMissionVehicles(dt: number) {
    for (const vehicle of this.missionVehicles) {
      if (vehicle.completed) continue;
      if (!vehicle.active && this.player.x >= vehicle.triggerX) {
        vehicle.active = true;
        vehicle.root.setEnabled(true);
      }
      if (!vehicle.active) continue;

      if (vehicle.kind === "jeep") {
        const dx = vehicle.targetX - vehicle.root.position.x;
        if (Math.abs(dx) > 0.18) {
          vehicle.root.position.x += Math.sign(dx) * dt * 7.6;
          vehicle.root.rotation.z = Math.sin(this.elapsed * 17) * 0.015;
          this.animatePart(vehicle.root, "wheel-a", 0, Math.sin(this.elapsed * 23) * 0.06);
          this.animatePart(vehicle.root, "wheel-b", 0, -Math.sin(this.elapsed * 23) * 0.06);
        } else if (!vehicle.spawned) {
          vehicle.spawned = true;
          this.spawnCombatFx(vehicle.targetX + 1.4, -5.0, "smoke");
          this.spawnReinforcementSoldier(vehicle.targetX + 0.7, "jeep");
          this.spawnReinforcementSoldier(vehicle.targetX + 1.5, "jeep");
          this.spawnReinforcementSoldier(vehicle.targetX + 2.3, "jeep");
          vehicle.cooldown = 1.1;
        } else {
          vehicle.cooldown -= dt;
          if (vehicle.cooldown <= 0) {
            vehicle.root.position.x += dt * 7.8;
            if (vehicle.root.position.x > vehicle.targetX + 11) { vehicle.root.setEnabled(false); vehicle.completed = true; }
          }
        }
      } else {
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
        if (vehicle.root.position.x < vehicle.targetX - 13) { vehicle.root.setEnabled(false); vehicle.completed = true; }
      }
    }
  }

  private resetMission() {
    this.projectiles.forEach((projectile) => projectile.mesh.dispose());
    this.projectiles = [];
    this.cameraShake = 0;
    this.combatFx.forEach((fx) => fx.root.dispose());
    this.combatFx = [];
    this.selected = this.selected;
    const data = CHARACTERS[this.selected];
    this.playerRoot.dispose();
    const visual = explorerSprite(this.scene, data, `hero-${data.id}`);
    visual.parent = this.worldRoot;
    this.playerRoot = visual;
    this.player = { x: 2, y: -5.15, vy: 0, dir: 1, health: data.maxHealth, grenades: data.grenades, score: 0, rescued: 0, invincible: 0, inRover: false };
    this.roverRoot.position.set(36, -5.15, 0);
    this.roverRoot.setEnabled(true);
    this.bossRoot.position.set(84, -4.68, 0);
    this.bossRoot.setEnabled(false);
    this.boss = { active: false, hp: 36, maxHp: 36, cooldown: 1.5, direction: -1 };
    this.hasRover = false;
    this.resetSecurityRoute();
    this.createMissionActors();
    this.syncPlayerVisual();
  }

  private showMenu() {
    this.state = "menu";
    this.menuIndex = 0;
    this.menuBoard.visible(true);
    this.hudBoard.visible(false);
    this.bossMeter.root.setEnabled(false);
    this.previewAri.setEnabled(false);
    this.previewDax.setEnabled(false);
    this.brandMark.setEnabled(true);
    this.renderMenu();
  }

  private renderMenu() {
    const previewVisible = this.state === "select";
    this.previewAri.setEnabled(previewVisible && this.selected === "ari");
    this.previewDax.setEnabled(previewVisible && this.selected === "dax");
    this.brandMark.setEnabled(this.state !== "play");
    if (this.state === "menu") {
      this.menuBoard.setText("PIXEL FRONTIER", ["INICIAR MISSÃO", "MANUAL DE CAMPO", `GRÁFICOS // ${QUALITY_OPTIONS[this.qualityIndex].label}`, "CRÉDITOS", "", "OPERAÇÃO: LINHA DE FOGO", "ARROWS + ENTER"], this.menuIndex);
    } else if (this.state === "select") {
      const data = CHARACTERS[this.selected];
      const other = this.selected === "ari" ? CHARACTERS.dax : CHARACTERS.ari;
      this.menuBoard.setText("ESCOLHA O BATEDOR", [
        `${data.name} // ${data.role.toUpperCase()}`,
        `${data.callSign}`,
        `VELOCIDADE ${"■".repeat(Math.round(data.speed / 2))}   PULSO ${"■".repeat(data.id === "ari" ? 5 : 4)}`,
        `GRANADAS ${data.grenades}   BLINDAGEM ${data.maxHealth}`,
        data.id === "ari" ? "RAJADAS CURTAS. TRÊS GRANADAS DE PULSO." : "PULSOS PESADOS. QUATRO GRANADAS DE IMPACTO.",
        `←/→ ${other.name}   |   ENTER: PARTIR   |   ESC: VOLTAR`,
      ]);
    } else if (this.state === "manual") {
      this.menuBoard.setText("MANUAL DE CAMPO", [
        "A/D ou ←/→   DESLOCAR", "W/↑             SALTAR", "ESPAÇO / X      DISPARAR",
        "SHIFT          GRANADA", "E              ROVER / RÁDIO", "ESC            VOLTAR AO MENU",
      ]);
    } else if (this.state === "quality") {
      const active = QUALITY_OPTIONS[this.qualityIndex];
      this.menuBoard.setText("PERFIL GRÁFICO", [
        "BAIXO // CAMADAS ESSENCIAIS", "MÉDIO // RUÍNAS E POEIRA", "ALTO // CÉU DENSO E PRIMEIRO PLANO", "", active.description, "↑/↓ SELECIONA   ENTER: APLICAR   ESC: VOLTAR",
      ], this.qualityIndex);
    } else if (this.state === "credits") {
      this.menuBoard.setText("TRANSMISSÃO RECEBIDA", ["PIXEL FRONTIER", "CONCEITO, SISTEMAS E ARTE MODULAR", "UMA MISSÃO ORIGINAL DE PIXEL ART 16-BIT", "", "ENTER OU ESC PARA RETORNAR"]);
    } else if (this.state === "win") {
      this.menuBoard.setText("MISSÃO CUMPRIDA", [
        `PONTUAÇÃO ${this.player.score.toString().padStart(6, "0")}`,
        `EXPLORADORES RESGATADOS ${this.player.rescued}/3`, "A LINHA INIMIGA FOI ROMPIDA.", "", "ENTER: NOVA ROTA    ESC: MENU",
      ]);
    } else if (this.state === "lose") {
      this.menuBoard.setText("SINAL PERDIDO", ["A EQUIPE NÃO CONSEGUIU CRUZAR A ZONA DE EXTRAÇÃO.", `PONTUAÇÃO ${this.player.score.toString().padStart(6, "0")}`, "", "ENTER: TENTAR NOVAMENTE    ESC: MENU"]);
    }
  }

  private startMission() {
    this.resetMission();
    this.state = "play";
    this.menuBoard.visible(false);
    this.hudBoard.visible(true);
    this.previewAri.setEnabled(false);
    this.previewDax.setEnabled(false);
    this.brandMark.setEnabled(false);
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
  }

  public handleKeyDown(rawKey: string) {
    const key = rawKey.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "enter", "escape", "e"].includes(key) || rawKey === " ") this.handleAction(key, rawKey);
    this.keys.add(key);
  }

  public handleKeyUp(rawKey: string) {
    this.keys.delete(rawKey.toLowerCase());
  }

  private handleAction(key: string, rawKey: string) {
    if (this.state === "menu") {
      if (key === "arrowup" || key === "arrowdown") {
        this.menuIndex = (this.menuIndex + (key === "arrowup" ? 3 : 1)) % 4;
        this.renderMenu();
      }
      if (key === "enter" || rawKey === " ") {
        if (this.menuIndex === 0) { this.state = "select"; this.renderMenu(); }
        if (this.menuIndex === 1) { this.state = "manual"; this.renderMenu(); }
        if (this.menuIndex === 2) { this.state = "quality"; this.renderMenu(); }
        if (this.menuIndex === 3) { this.state = "credits"; this.renderMenu(); }
      }
      return;
    }
    if (this.state === "select") {
      if (key === "arrowleft" || key === "arrowright") { this.selected = this.selected === "ari" ? "dax" : "ari"; this.renderMenu(); }
      if (key === "enter" || rawKey === " ") this.startMission();
      if (key === "escape") this.showMenu();
      return;
    }
    if (this.state === "quality") {
      if (key === "arrowup" || key === "arrowdown") {
        this.qualityIndex = (this.qualityIndex + (key === "arrowup" ? 2 : 1)) % QUALITY_OPTIONS.length;
        this.renderMenu();
      }
      if (key === "enter" || rawKey === " ") {
        this.setQuality(QUALITY_OPTIONS[this.qualityIndex].id);
        this.state = "menu";
        this.menuIndex = 2;
        this.renderMenu();
      }
      if (key === "escape") this.showMenu();
      return;
    }
    if (["manual", "credits"].includes(this.state)) {
      if (key === "escape" || key === "enter") this.showMenu();
      return;
    }
    if (this.state === "win" || this.state === "lose") {
      if (key === "enter" || rawKey === " ") this.startMission();
      if (key === "escape") this.showMenu();
      return;
    }
    if (this.state === "play" && key === "escape") this.showMenu();
  }

  public update(delta: number) {
    const dt = Math.min(delta, 0.035);
    this.elapsed += dt;
    this.positionUi();
    this.updateQualityDecor();
    if (this.state !== "play") return;
    this.updateMission(dt);
  }

  private updateQualityDecor() {
    if (this.quality !== "high") return;
    this.dustMotes.forEach((mote) => {
      mote.mesh.position.y = mote.y + Math.sin(this.elapsed * 0.72 + mote.phase) * 0.24;
      mote.mesh.position.x = mote.x + Math.cos(this.elapsed * 0.32 + mote.phase) * 0.38;
      mote.mesh.scaling.setAll(0.78 + Math.max(0, Math.sin(this.elapsed * 1.7 + mote.phase)) * 0.45);
    });
  }

  private animatePart(root: TransformNode, tag: string, offsetX: number, offsetY: number) {
    const part = root.getChildMeshes().find((mesh) => mesh.name === `${root.name}-${tag}`);
    if (!part) return;
    const stored = part.metadata as { baseX?: number; baseY?: number } | null;
    const base = stored ?? { baseX: part.position.x, baseY: part.position.y };
    part.metadata = base;
    part.position.x = (base.baseX ?? 0) + offsetX;
    part.position.y = (base.baseY ?? 0) + offsetY;
  }

  private setPartVisible(root: TransformNode, tag: string, visible: boolean) {
    root.getChildMeshes().find((mesh) => mesh.name === `${root.name}-${tag}`)?.setEnabled(visible);
  }

  private overlaps(a: Hitbox, b: Hitbox) {
    return Math.abs(a.x - b.x) <= a.halfWidth + b.halfWidth && Math.abs(a.y - b.y) <= a.halfHeight + b.halfHeight;
  }

  private projectileBox(projectile: Projectile): Hitbox {
    return { x: projectile.x, y: projectile.y, halfWidth: projectile.halfWidth, halfHeight: projectile.halfHeight };
  }

  private enemyBox(enemy: Enemy): Hitbox {
    return enemy.kind === "drone"
      ? { x: enemy.x, y: enemy.root.position.y, halfWidth: 0.62, halfHeight: 0.38 }
      : { x: enemy.x, y: enemy.root.position.y + 0.08, halfWidth: 0.66, halfHeight: 0.88 };
  }

  private activePlayerBox(): Hitbox {
    const template = this.hasRover ? this.roverHitbox : this.playerHitbox;
    return { x: this.player.x + template.x, y: this.player.y + template.y, halfWidth: template.halfWidth, halfHeight: template.halfHeight };
  }

  private resetSecurityRoute() {
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

  private updateSecurityRoute(dt: number) {
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
      if (!door.open) return;
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

  private resolveTerrain(previousX: number, previousY: number) {
    const activeBox = this.activePlayerBox();
    const solidBoxes = [
      ...this.obstacles.filter((obstacle) => obstacle.active).map((obstacle) => obstacle.box),
      ...this.securityDoors.filter((door) => !door.open).map((door) => door.box),
    ];
    for (const box of solidBoxes) {
      if (!this.overlaps(activeBox, box)) continue;
      const cameFromLeft = previousX + activeBox.halfWidth <= box.x;
      const cameFromRight = previousX - activeBox.halfWidth >= box.x;
      if (cameFromLeft) this.player.x = box.x - box.halfWidth - activeBox.halfWidth - 0.02;
      else if (cameFromRight) this.player.x = box.x + box.halfWidth + activeBox.halfWidth + 0.02;
      else if (this.player.x < box.x) this.player.x = box.x - box.halfWidth - activeBox.halfWidth - 0.02;
      else this.player.x = box.x + box.halfWidth + activeBox.halfWidth + 0.02;
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

  private updateMission(dt: number) {
    this.demoTime += dt;
    const data = CHARACTERS[this.selected];
    const demoMove = this.isDemo && !this.demoTerrain && (this.demoSecurity ? this.demoTime > 1.25 && this.demoTime < 4.2 : this.demoTime < 12);
    const moveLeft = this.keys.has("a") || this.keys.has("arrowleft");
    const moveRight = this.keys.has("d") || this.keys.has("arrowright") || demoMove;
    const jump = this.keys.has("w") || this.keys.has("arrowup");
    const fire = this.keys.has("x") || this.keys.has(" ") || (this.isDemo && this.demoTime > 1.2);
    const grenade = this.keys.has("shift") || (this.isDemo && this.demoTime > 4.8 && this.demoTime < 5.1);
    const nearRover = !this.hasRover && this.overlaps(this.activePlayerBox(), { x: this.roverRoot.position.x, y: this.roverRoot.position.y - 0.28, halfWidth: 1.80, halfHeight: 0.92 });
    if ((this.keys.has("e") || (this.isDemo && this.player.x > 34)) && nearRover) this.hasRover = true;

    const previousX = this.player.x;
    const previousY = this.player.y;
    let speed = data.speed * (this.hasRover ? 0.92 : 1);
    if (moveLeft) { this.player.x -= speed * dt; this.player.dir = -1; }
    if (moveRight) { this.player.x += speed * dt; this.player.dir = 1; }
    this.player.x = Math.max(1, Math.min(this.player.x, 91));
    if (jump && this.player.vy === 0) this.player.vy = 11.5;
    this.player.vy -= 27 * dt;
    this.player.y += this.player.vy * dt;
    this.resolveTerrain(previousX, previousY);
    this.fireTimer -= dt;
    this.grenadeTimer -= dt;
    this.shotFlash = Math.max(0, this.shotFlash - dt);
    if (fire && this.fireTimer <= 0) {
      this.spawnProjectile(this.player.x + this.player.dir * (this.hasRover ? 1.8 : 0.85), this.player.y + 0.44, this.player.dir * (this.hasRover ? 24 : 19), 0, true, this.hasRover ? 2 : 1, false);
      this.fireTimer = data.fireRate;
      this.shotFlash = 0.10;
      this.spawnCombatFx(this.player.x + this.player.dir * (this.hasRover ? 2.05 : 1.55), this.player.y + 0.48, "hit");
    }
    if (grenade && this.player.grenades > 0 && this.grenadeTimer <= 0) {
      this.player.grenades -= 1;
      this.spawnProjectile(this.player.x + this.player.dir * 0.8, this.player.y + 0.8, this.player.dir * 11, 8.5, true, 5, true);
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
    this.updateBoss(dt);
    this.updateHud(dt);
  }

  private syncPlayerVisual() {
    this.playerRoot.position.set(this.player.x, this.player.y, 0);
    const moving = this.keys.has("a") || this.keys.has("d") || this.keys.has("arrowleft") || this.keys.has("arrowright") || (this.isDemo && this.demoTime < 12);
    const stride = moving && this.player.vy === 0 ? Math.sin(this.elapsed * 16) : 0;
    const jumping = this.player.y > -5.13;
    const damagePulse = this.player.invincible > 0 ? (Math.floor(this.elapsed * 20) % 2 === 0 ? 1 : 0.86) : 1;
    this.playerRoot.scaling.x = this.player.dir * damagePulse;
    this.playerRoot.scaling.y = jumping ? 1.06 : damagePulse;
    this.playerRoot.setEnabled(!this.hasRover && (this.player.invincible <= 0 || Math.floor(this.elapsed * 18) % 2 === 0));
    const playerFrame = jumping ? 6 : this.shotFlash > 0 ? 7 : moving ? 2 + (Math.floor(this.elapsed * 12) % 4) : Math.floor(this.elapsed * 2.4) % 2;
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
    } else this.roverRoot.position.x = 36;
    const bounce = this.player.vy !== 0 ? 0.08 : Math.sin(this.elapsed * 10) * 0.03;
    this.playerRoot.position.y += bounce;
  }

  private updateEnemies(dt: number) {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      if (!enemy.active) {
        if (this.player.x < enemy.triggerX) continue;
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
          if (Math.abs(enemy.root.position.y - enemy.y) < 0.15 && Math.abs(enemy.x - enemy.entryX) < 0.18) enemy.entering = false;
        } else {
          const dx = enemy.entryX - enemy.x;
          enemy.x += Math.sign(dx) * Math.min(Math.abs(dx), dt * 4.8);
          enemy.root.position.x = enemy.x;
          enemy.root.scaling.x = -1;
          setAssetFrame(enemy.root, 1 + (Math.floor(this.elapsed * 12 + enemy.drift) % 4));
          if (Math.abs(dx) < 0.2) enemy.entering = false;
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

  private updateRescues() {
    for (const rescue of this.rescues) {
      const rescueBox: Hitbox = { x: rescue.x, y: rescue.root.position.y, halfWidth: 0.40, halfHeight: 0.84 };
      if (rescue.active && this.overlaps(this.activePlayerBox(), rescueBox)) {
        rescue.active = false;
        rescue.root.setEnabled(false);
        this.player.rescued += 1;
        this.player.score += 1000;
      }
    }
  }

  private updateBoss(dt: number) {
    if (!this.boss.active && this.player.x > 68) {
      this.boss.active = true;
      this.bossRoot.setEnabled(true);
    }
    if (!this.boss.active) return;
    this.bossRoot.position.y = -4.68 + Math.sin(this.elapsed * 1.8) * 0.12;
    const warningPulse = 1 + Math.max(0, Math.sin(this.elapsed * 5.5)) * 0.035;
    this.bossRoot.scaling.setAll(warningPulse);
    this.animatePart(this.bossRoot, "drill", 0, Math.sin(this.elapsed * 7) * 0.08);
    const bossFrame = this.boss.hp < this.boss.maxHp * 0.25 ? 5 : this.boss.hp < this.boss.maxHp * 0.55 ? 4 : this.boss.cooldown < 0.22 ? 3 : Math.floor(this.elapsed * 2.2) % 3;
    setAssetFrame(this.bossRoot, bossFrame);
    this.setPartVisible(this.bossRoot, "muzzle", this.boss.cooldown < 0.22);
    this.boss.cooldown -= dt;
    if (this.boss.cooldown <= 0) {
      const direction = this.player.x < 84 ? -1 : 1;
      this.spawnProjectile(81.6, -4.5, direction * 9, 0.9, false, 1, true);
      this.boss.cooldown = 1.2;
    }
  }

  private spawnCombatFx(x: number, y: number, kind: "hit" | "explosion" | "smoke") {
    const id = Math.random().toString(36).slice(2);
    const root = kind === "explosion"
      ? assetSheetSprite(this.scene, `explosion-${id}`, `${import.meta.env.BASE_URL}assets/explosion_sheet.png`, 10, 2.45, 2.45, -1.2)
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
    if (kind === "explosion") this.cameraShake = Math.min(0.34, this.cameraShake + 0.14);
    this.combatFx.push({ root, life: maxLife, maxLife, kind });
  }

  private updateCombatFx(dt: number) {
    const alive: CombatFx[] = [];
    for (const fx of this.combatFx) {
      fx.life -= dt;
      const progress = 1 - fx.life / fx.maxLife;
      if (fx.kind === "explosion") {
        setAssetFrame(fx.root, Math.min(9, Math.floor(progress * 10)));
        fx.root.scaling.setAll(0.70 + Math.sin(Math.min(1, progress) * Math.PI) * 0.62);
      } else if (fx.kind === "hit") {
        fx.root.scaling.setAll(0.7 + progress * 0.8);
        fx.root.rotation.z += dt * 7;
      } else {
        fx.root.position.y += dt * 1.4;
        fx.root.scaling.setAll(0.7 + progress * 1.1);
      }
      if (fx.life <= 0) fx.root.dispose(); else alive.push(fx);
    }
    this.combatFx = alive;
  }

  private spawnProjectile(x: number, y: number, vx: number, vy: number, ally: boolean, damage: number, burst: boolean) {
    const mesh = rect(this.scene, `bullet-${Math.random().toString(36).slice(2)}`, burst ? 0.42 : 0.42, burst ? 0.42 : 0.10, ally ? (burst ? "#f2c45f" : "#fff1b0") : "#e85b32", this.worldRoot, x, y, -0.9);
    this.projectiles.push({ mesh, x, y, vx, vy, life: burst ? 1.45 : 1.8, ally, damage, burst, halfWidth: burst ? 0.64 : 0.18, halfHeight: burst ? 0.64 : 0.12, hitTargets: new Set<string>() });
  }

  private updateProjectiles(dt: number) {
    const survivors: Projectile[] = [];
    for (const projectile of this.projectiles) {
      projectile.life -= dt;
      projectile.vy -= projectile.burst ? 14 * dt : 0;
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.mesh.position.set(projectile.x, projectile.y, -0.9);
      if (projectile.burst) projectile.mesh.scaling.setAll(1 + (1.4 - projectile.life) * 0.45);
      let consumed = projectile.life <= 0 || projectile.y < -5.75;
      for (const door of this.securityDoors) {
        if (!door.open && this.overlaps(this.projectileBox(projectile), door.box)) {
          consumed = true;
          break;
        }
      }
      for (const obstacle of this.obstacles) {
        if (!obstacle.active || !this.overlaps(this.projectileBox(projectile), obstacle.box)) continue;
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
          if (!enemy.alive) continue;
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
        const bossBox: Hitbox = { ...this.bossHitbox, y: this.bossRoot.position.y + 0.22, halfWidth: 2.32, halfHeight: 0.96 };
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
      } else if (this.overlaps(this.projectileBox(projectile), this.activePlayerBox())) {
        consumed = true;
        this.damagePlayer();
      }
      if (consumed) projectile.mesh.dispose(); else survivors.push(projectile);
    }
    this.projectiles = survivors;
  }

  private damagePlayer() {
    if (this.player.invincible > 0) return;
    this.player.invincible = 1.05;
    this.player.health -= this.hasRover ? 0.5 : 1;
    if (this.player.health <= 0) this.finish("lose");
  }

  private finish(result: "win" | "lose") {
    this.state = result;
    this.menuBoard.visible(true);
    this.hudBoard.visible(false);
    this.bossMeter.root.setEnabled(false);
    this.renderMenu();
  }

  private updateHud(dt: number) {
    this.dirtyHud -= dt;
    if (this.dirtyHud > 0) return;
    this.dirtyHud = 0.09;
    const data = CHARACTERS[this.selected];
    this.hudBoard.setText("LINHA DE FOGO", [
      `VITAL ${"■".repeat(Math.max(0, Math.ceil(this.player.health)))}${"□".repeat(Math.max(0, data.maxHealth - Math.ceil(this.player.health)))}   GRANADAS ${this.player.grenades}   ROTA ${Math.floor(this.player.x)}%`,
      `PONTOS ${this.player.score.toString().padStart(6, "0")}   ${this.securityNotice}   Q:${QUALITY_OPTIONS[this.qualityIndex].label}`,
    ]);
    this.bossMeter.root.setEnabled(this.boss.active);
    this.bossMeter.fill.scaling.x = Math.max(0, this.boss.hp / this.boss.maxHp);
  }

  private positionUi() {
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

  public dispose() {
    this.projectiles.forEach((projectile) => projectile.mesh.dispose());
    this.combatFx.forEach((fx) => fx.root.dispose());
    this.worldRoot.dispose();
    this.uiRoot.dispose();
  }
}
