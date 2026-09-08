const KEY = "pixel-frontier-save-v3";
const LEGACY_KEYS = ["pixel-frontier-save-v2", "pixel-frontier-save-v1"];

const defaults = {
    version: 3,
    unlockedLevel: 1,
    currentLevel: 1,
    checkpointX: 2,
    checkpointState: null,
    selectedCharacter: "ari",
    highScores: {},
    settings: {
        quality: "auto",
        masterVolume: 0.8,
        musicVolume: 0.55,
        sfxVolume: 0.8,
        difficulty: "normal",
    },
};

const clone = (value) => {
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
};

export class SaveManager {
    data;
    storageAvailable = true;
    constructor() { this.data = this.load(); }
    load() {
        if (typeof window === "undefined") return clone(defaults);
        try {
            let raw = window.localStorage.getItem(KEY);
            if (!raw) {
                for (const legacy of LEGACY_KEYS) {
                    raw = window.localStorage.getItem(legacy);
                    if (raw) break;
                }
            }
            if (!raw) return clone(defaults);
            const parsed = JSON.parse(raw);
            const normalized = {
                ...clone(defaults),
                ...parsed,
                version: 3,
                settings: { ...defaults.settings, ...(parsed.settings ?? {}) },
                highScores: { ...(parsed.highScores ?? {}) },
                checkpointState: parsed.checkpointState && typeof parsed.checkpointState === "object" ? parsed.checkpointState : null,
            };
            this.safePersist(normalized);
            return normalized;
        } catch {
            this.storageAvailable = false;
            return clone(defaults);
        }
    }
    get snapshot() { return clone(this.data); }
    update(patch) {
        this.data = { ...this.data, ...patch, settings: { ...this.data.settings, ...(patch.settings ?? {}) } };
        this.persist();
    }
    setCheckpoint(level, x, checkpointState = null) {
        this.data.currentLevel = level;
        this.data.checkpointX = x;
        this.data.checkpointState = checkpointState ? clone(checkpointState) : null;
        this.persist();
    }
    unlock(level) {
        this.data.unlockedLevel = Math.max(this.data.unlockedLevel, level);
        this.data.currentLevel = level;
        this.data.checkpointX = 2;
        this.data.checkpointState = null;
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
        this.data.checkpointState = null;
        this.persist();
    }
    safePersist(data) {
        if (typeof window === "undefined") return;
        try {
            window.localStorage.setItem(KEY, JSON.stringify(data));
            this.storageAvailable = true;
        } catch {
            this.storageAvailable = false;
        }
    }
    persist() { this.safePersist(this.data); }
}
