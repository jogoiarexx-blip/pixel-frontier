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
    },
};
export class AssetManager {
    loaded = new Set();
    async preloadLevel(level, onProgress) {
        const queue = [...ASSET_MANIFEST.shared, ...(ASSET_MANIFEST.levels[level] ?? [])].filter((u) => !this.loaded.has(u));
        if (queue.length === 0) {
            onProgress?.(1, "PRONTO");
            return;
        }
        let completed = 0;
        await Promise.all(queue.map((url) => new Promise((resolve) => {
            const image = new Image();
            const done = () => {
                this.loaded.add(url);
                completed += 1;
                onProgress?.(completed / queue.length, url.split("/").pop() ?? "ASSET");
                resolve();
            };
            image.onload = done;
            image.onerror = done; // fail-soft: Babylon pode tentar novamente e o loading não trava.
            image.src = url;
        })));
    }
    releaseLevel(level) {
        // Shared fica aquecido; assets exclusivos da fase saem do conjunto ativo e serão revalidados no próximo acesso.
        for (const url of ASSET_MANIFEST.levels[level] ?? [])
            this.loaded.delete(url);
    }
}
