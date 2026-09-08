export class AudioManager {
    ctx = null;
    master = 0.8;
    music = 0.55;
    sfx = 0.8;
    hum = null;
    humGain = null;
    musicLfo = null;
    setVolumes(master, music, sfx) {
        this.master = Math.max(0, Math.min(1, Number(master) || 0));
        this.music = Math.max(0, Math.min(1, Number(music) || 0));
        this.sfx = Math.max(0, Math.min(1, Number(sfx) || 0));
        if (this.humGain) this.humGain.gain.value = 0.022 * this.master * this.music;
    }
    ensure() {
        if (!this.ctx && typeof window !== "undefined") {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return null;
            try { this.ctx = new AudioCtx(); } catch { return null; }
        }
        if (this.ctx?.state === "suspended") void this.ctx.resume().catch(() => {});
        return this.ctx;
    }
    suspend() {
        if (this.ctx?.state === "running") void this.ctx.suspend().catch(() => {});
    }
    playMusic() {
        const ctx = this.ensure();
        if (!ctx || this.hum) return;
        this.hum = ctx.createOscillator();
        this.humGain = ctx.createGain();
        this.musicLfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        this.hum.type = "sawtooth";
        this.hum.frequency.value = 55;
        this.musicLfo.type = "square";
        this.musicLfo.frequency.value = 2.1;
        lfoGain.gain.value = 3.5;
        this.musicLfo.connect(lfoGain).connect(this.hum.frequency);
        this.humGain.gain.value = 0.022 * this.master * this.music;
        this.hum.connect(this.humGain).connect(ctx.destination);
        this.hum.start();
        this.musicLfo.start();
    }
    stopMusic() {
        for (const osc of [this.hum, this.musicLfo]) {
            try { osc?.stop(); } catch {}
            try { osc?.disconnect(); } catch {}
        }
        try { this.humGain?.disconnect(); } catch {}
        this.hum = null;
        this.humGain = null;
        this.musicLfo = null;
    }
    sfxPlay(name) {
        const ctx = this.ensure();
        if (!ctx || this.master <= 0 || this.sfx <= 0) return;
        const table = {
            shoot: [220, 0.05, "square"], heavy: [160, 0.07, "square"], shotgun: [90, 0.12, "sawtooth"],
            rocket: [65, 0.20, "sawtooth"], grenade: [110, 0.09, "triangle"], hit: [420, 0.04, "square"],
            explosion: [48, 0.28, "sawtooth"], pickup: [720, 0.10, "square"], checkpoint: [880, 0.18, "triangle"],
            menu: [520, 0.05, "square"], boss: [72, 0.35, "sawtooth"]
        };
        const spec = table[name] ?? table.menu;
        const [freq, dur, type] = spec;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const now = ctx.currentTime;
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(Math.max(35, freq * 0.55), now + dur);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.08 * this.master * this.sfx), now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + dur + 0.02);
    }
    dispose() {
        this.stopMusic();
        if (this.ctx) void this.ctx.close().catch(() => {});
        this.ctx = null;
    }
}
