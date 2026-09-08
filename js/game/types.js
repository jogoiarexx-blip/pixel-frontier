// Pixel Frontier: dados de gameplay separados da moldura React.
export const QUALITY_OPTIONS = [
    { id: "auto", label: "AUTO", description: "AJUSTA DETALHES CONFORME DESEMPENHO E DENSIDADE DE PIXELS." },
    { id: "low", label: "BAIXO", description: "CAMADAS ESSENCIAIS. FOCO MÁXIMO EM FLUIDEZ." },
    { id: "medium", label: "MÉDIO", description: "RUÍNAS, NUVENS DE POEIRA E DETALHE EXTRA." },
    { id: "high", label: "ALTO", description: "CÉU DENSO, FAÍSCAS, PRIMEIRO PLANO E ALERTAS." },
];
export const WEAPONS = {
    rifle: { id: "rifle", label: "RIFLE", ammo: -1, maxAmmo: -1, fireRate: 0.16, damage: 1, speed: 19, burst: false },
    vulcan: { id: "vulcan", label: "VULCAN", ammo: 200, maxAmmo: 200, fireRate: 0.085, damage: 1, speed: 22, burst: false },
    shotgun: { id: "shotgun", label: "SCATTER", ammo: 36, maxAmmo: 36, fireRate: 0.48, damage: 2, speed: 17, burst: false, pellets: 5 },
    rocket: { id: "rocket", label: "HYDRA", ammo: 18, maxAmmo: 18, fireRate: 0.62, damage: 6, speed: 13, burst: true },
    flame: { id: "flame", label: "INFERNO", ammo: 120, maxAmmo: 120, fireRate: 0.09, damage: 1.2, speed: 11, burst: true },
};
export const CHARACTERS = {
    ari: {
        id: "ari", name: "ARI VOSS", callSign: "BATEDORA // VENTO NORTE", role: "Mobilidade & precisão",
        description: "Mais rápida em terreno aberto. Dispara em rajadas curtas e mantém três granadas.",
        jacket: "#e6752a", accent: "#41d6d1", speed: 8.8, fireRate: 0.16, grenades: 3, maxHealth: 4,
    },
    dax: {
        id: "dax", name: "DAX ROOK", callSign: "IMPACTO // LINHA DE FERRO", role: "Resistência & demolição",
        description: "Mais resistente em confronto direto. Seus pulsos viajam mais rápido e carrega quatro granadas.",
        jacket: "#457ca8", accent: "#f1bf5d", speed: 7.5, fireRate: 0.22, grenades: 4, maxHealth: 5,
    },
};
