export const LEVELS = [
    { id: 1, name: "VILA OCUPADA", operation: "LINHA DE FOGO", objective: "ROMPA A LINHA E DERRUBE O TANQUE ARGO", bossName: "ARGO MK-I", enemyHpScale: 1, enemyFireScale: 1, playerStartX: 2, checkpoints: [24, 48, 67], tint: "#c88a55" },
    { id: 2, name: "PONTE DE FERRO", operation: "AÇO PARTIDO", objective: "ATRAVESSE A PONTE E INTERCEPTE O TREM BLINDADO", bossName: "ARGO RAIL", enemyHpScale: 1.15, enemyFireScale: 0.92, playerStartX: 2, checkpoints: [22, 46, 69], tint: "#7d8890" },
    { id: 3, name: "SELVA MILITAR", operation: "FOLHA NEGRA", objective: "DESTRUA OS BUNKERS E LIMPE A ZONA AÉREA", bossName: "ARGO JUNGLE", enemyHpScale: 1.28, enemyFireScale: 0.84, playerStartX: 2, checkpoints: [20, 45, 66], tint: "#65764b" },
    { id: 4, name: "BASE INIMIGA", operation: "FERRO INTERNO", objective: "INVADA A BASE E DESATIVE A REDE DE DEFESA", bossName: "ARGO SIEGE", enemyHpScale: 1.42, enemyFireScale: 0.78, playerStartX: 2, checkpoints: [19, 43, 64], tint: "#5c6870" },
    { id: 5, name: "FORTALEZA", operation: "ÚLTIMO IMPACTO", objective: "ROMPA A FORTALEZA E DESTRUA O NÚCLEO DE GUERRA", bossName: "ARGO OMEGA", enemyHpScale: 1.62, enemyFireScale: 0.70, playerStartX: 2, checkpoints: [18, 42, 63], tint: "#805046" },
];
export const getLevel = (id) => LEVELS.find((l) => l.id === id) ?? LEVELS[0];
