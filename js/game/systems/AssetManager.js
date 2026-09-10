const BASE = "./";
export const ASSET_MANIFEST = {
    shared: [
        `${BASE}assets/hero_ari_sheet.png`,
        `${BASE}assets/hero_dax_sheet.png`,
        `${BASE}assets/hero_mika_sheet.png`,
        `${BASE}assets/hero_brutus_sheet.png`,
        `${BASE}assets/soldier_sheet.png`,
        `${BASE}assets/soldier_rifle_sheet.png`,
        `${BASE}assets/soldier_grenadier_sheet.png`,
        `${BASE}assets/soldier_machinegunner_sheet.png`,
        `${BASE}assets/soldier_sniper_sheet.png`,
        `${BASE}assets/soldier_shield_sheet.png`,
        `${BASE}assets/explosion_sheet.png`,
        `${BASE}assets/enemy_death_sheet.png`,
        `${BASE}assets/enemy_death_rifle_sheet.png`,
        `${BASE}assets/enemy_death_grenadier_sheet.png`,
        `${BASE}assets/enemy_death_machinegunner_sheet.png`,
        `${BASE}assets/enemy_death_sniper_sheet.png`,
        `${BASE}assets/enemy_death_shield_sheet.png`,
        `${BASE}assets/vehicle_explosion_sheet.png`,
        `${BASE}assets/drone_sheet.png`,
        `${BASE}assets/rover_sheet.png`,
        `${BASE}assets/enemy_jeep_sheet.png`,
        `${BASE}assets/attack_helicopter_sheet.png`,
        `${BASE}assets/rescue_sheet.png`,
        `${BASE}assets/ui/title_logo.png`,
        `${BASE}assets/ui/menu_backdrop.png`,
        `${BASE}assets/ui/select_backdrop.png`,
        `${BASE}assets/ui/portrait_ari_sheet.png`,
        `${BASE}assets/ui/portrait_dax_sheet.png`,
        `${BASE}assets/ui/portrait_mika_sheet.png`,
        `${BASE}assets/ui/portrait_brutus_sheet.png`,
    ],
    levels: {
        1: [`${BASE}assets/boss_argo_sheet.png`, `${BASE}assets/stages/stage_01_backdrop.png`],
        2: [`${BASE}assets/boss_argo_sheet.png`, `${BASE}assets/stages/stage_02_backdrop.png`],
        3: [`${BASE}assets/boss_argo_sheet.png`, `${BASE}assets/stages/stage_03_backdrop.png`],
        4: [`${BASE}assets/boss_argo_sheet.png`, `${BASE}assets/stages/stage_04_backdrop.png`],
        5: [`${BASE}assets/boss_argo_sheet.png`, `${BASE}assets/stages/stage_05_backdrop.png`],
        6: [`${BASE}assets/boss_argo_sheet.png`, `${BASE}assets/stages/stage_06_backdrop.png`],
        7: [`${BASE}assets/boss_argo_sheet.png`, `${BASE}assets/stages/stage_07_backdrop.png`],
        8: [`${BASE}assets/boss_argo_sheet.png`, `${BASE}assets/stages/stage_08_backdrop.png`],
        9: [`${BASE}assets/boss_argo_sheet.png`, `${BASE}assets/stages/stage_09_backdrop.png`],
        10: [`${BASE}assets/boss_argo_sheet.png`, `${BASE}assets/stages/stage_10_backdrop.png`],
        11: [`${BASE}assets/boss_argo_sheet.png`, `${BASE}assets/stages/stage_11_backdrop.png`],
        12: [`${BASE}assets/boss_argo_sheet.png`, `${BASE}assets/stages/stage_12_backdrop.png`],
    },
};

function preloadImage(url, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        let settled = false;
        const finish = (error) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            image.onload = null;
            image.onerror = null;
            error ? reject(error) : resolve(url);
        };
        const timer = setTimeout(() => finish(new Error(`Tempo excedido ao carregar ${url}`)), timeoutMs);
        image.onload = () => finish();
        image.onerror = () => finish(new Error(`Falha ao carregar ${url}`));
        image.decoding = "async";
        image.src = url;
    });
}

export class AssetManager {
    loaded = new Set();
    failed = new Set();
    async preloadLevel(level, onProgress) {
        const all = [...new Set([...ASSET_MANIFEST.shared, ...(ASSET_MANIFEST.levels[level] ?? [])])];
        const queue = all.filter((url) => !this.loaded.has(url));
        if (queue.length === 0) {
            onProgress?.(1, "PRONTO");
            return;
        }
        let completed = 0;
        const failures = [];
        for (const url of queue) {
            onProgress?.(completed / queue.length, url.split("/").pop() ?? "ASSET");
            try {
                await preloadImage(url);
                this.loaded.add(url);
                this.failed.delete(url);
            } catch (error) {
                this.failed.add(url);
                failures.push(error instanceof Error ? error.message : String(error));
            }
            completed += 1;
            onProgress?.(completed / queue.length, url.split("/").pop() ?? "ASSET");
        }
        if (failures.length) {
            throw new Error(`Assets ausentes ou inválidos: ${failures.join(" | ")}`);
        }
    }
    releaseLevel(level) {
        // O navegador mantém cache HTTP; removemos apenas a marca lógica de assets exclusivos.
        for (const url of ASSET_MANIFEST.levels[level] ?? []) {
            if (!ASSET_MANIFEST.shared.includes(url)) this.loaded.delete(url);
        }
    }
}
