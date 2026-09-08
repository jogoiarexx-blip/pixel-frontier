const BASE = "./";
export const ASSET_MANIFEST = {
    shared: [
        `${BASE}assets/hero_ari_sheet.png`,
        `${BASE}assets/hero_dax_sheet.png`,
        `${BASE}assets/soldier_sheet.png`,
        `${BASE}assets/explosion_sheet.png`,
    ],
    levels: {
        1: [`${BASE}assets/boss_argo_sheet.png`],
        2: [`${BASE}assets/boss_argo_sheet.png`],
        3: [`${BASE}assets/boss_argo_sheet.png`],
        4: [`${BASE}assets/boss_argo_sheet.png`],
        5: [`${BASE}assets/boss_argo_sheet.png`],
        6: [`${BASE}assets/boss_argo_sheet.png`],
        7: [`${BASE}assets/boss_argo_sheet.png`],
        8: [`${BASE}assets/boss_argo_sheet.png`],
        9: [`${BASE}assets/boss_argo_sheet.png`],
        10: [`${BASE}assets/boss_argo_sheet.png`],
        11: [`${BASE}assets/boss_argo_sheet.png`],
        12: [`${BASE}assets/boss_argo_sheet.png`],
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
