const KEY = "pixel-frontier-save-v2";
const defaults = {
    version: 2,
    unlockedLevel: 1,
    currentLevel: 1,
    checkpointX: 2,
    highScores: {},
    settings: {
        quality: "auto",
        masterVolume: 0.8,
        musicVolume: 0.55,
        sfxVolume: 0.8,
        difficulty: "normal",
    },
};
export class SaveManager {
    data;
    constructor() {
        this.data = this.load();
    }
    load() {
        if (typeof window === "undefined")
            return structuredClone(defaults);
        try {
            const raw = window.localStorage.getItem(KEY);
            if (!raw)
                return structuredClone(defaults);
            const parsed = JSON.parse(raw);
            return {
                ...structuredClone(defaults),
                ...parsed,
                settings: { ...defaults.settings, ...(parsed.settings ?? {}) },
                highScores: { ...(parsed.highScores ?? {}) },
            };
        }
        catch {
            return structuredClone(defaults);
        }
    }
    get snapshot() { return structuredClone(this.data); }
    update(patch) {
        this.data = { ...this.data, ...patch, settings: { ...this.data.settings, ...(patch.settings ?? {}) } };
        this.persist();
    }
    setCheckpoint(level, x) {
        this.data.currentLevel = level;
        this.data.checkpointX = x;
        this.persist();
    }
    unlock(level) {
        this.data.unlockedLevel = Math.max(this.data.unlockedLevel, level);
        this.data.currentLevel = level;
        this.data.checkpointX = 2;
        this.persist();
    }
    recordScore(level, score) {
        const key = String(level);
        this.data.highScores[key] = Math.max(this.data.highScores[key] ?? 0, score);
        this.persist();
    }
    resetCheckpoint(level = this.data.currentLevel) {
        this.data.currentLevel = level;
        this.data.checkpointX = 2;
        this.persist();
    }
    persist() {
        if (typeof window !== "undefined")
            window.localStorage.setItem(KEY, JSON.stringify(this.data));
    }
}
