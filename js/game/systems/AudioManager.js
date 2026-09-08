export class AudioManager {
    ctx = null;
    master = 0.8;
    music = 0.55;
    sfx = 0.8;
    hum = null;
    humGain = null;
    setVolumes(master, music, sfx) {
        this.master = master;
        this.music = music;
        this.sfx = sfx;
        if (this.humGain)
            this.humGain.gain.value = 0.025 * this.master * this.music;
    }
    ensure() {
        if (!this.ctx && typeof window !== "undefined")
            this.ctx = new AudioContext();
        if (this.ctx?.state === "suspended")
            void this.ctx.resume();
        return this.ctx;
    }
    playMusic() {
        const ctx = this.ensure();
        if (!ctx || this.hum)
            return;
        this.hum = ctx.createOscillator();
        this.humGain = ctx.createGain();
        this.hum.type = "sawtooth";
        this.hum.frequency.value = 55;
        this.humGain.gain.value = 0.025 * this.master * this.music;
        this.hum.connect(this.humGain).connect(ctx.destination);
        this.hum.start();
    }
    stopMusic() {
        try {
            this.hum?.stop();
        }
        catch { }
        this.hum?.disconnect();
        this.humGain?.disconnect();
        this.hum = null;
        this.humGain = null;
    }
    sfxPlay(name) {
        const ctx = this.ensure();
        if (!ctx)
            return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const now = ctx.currentTime;
        const table = {
            shoot: [220, 0.05, "square"], heavy: [160, 0.07, "square"], shotgun: [90, 0.12, "sawtooth"], rocket: [65, 0.20, "sawtooth"], grenade: [110, 0.09, "triangle"], hit: [420, 0.04, "square"], explosion: [48, 0.28, "sawtooth"], pickup: [720, 0.10, "square"], checkpoint: [880, 0.18, "triangle"], menu: [520, 0.05, "square"], boss: [72, 0.35, "sawtooth"]
        };
        const [freq, dur, type] = table[name];
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
    dispose() { this.stopMusic(); void this.ctx?.close(); this.ctx = null; }
}
