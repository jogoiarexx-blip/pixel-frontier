// Fronteira de Cobre: dados de gameplay separados da moldura React.

export type GameState = "menu" | "select" | "manual" | "quality" | "credits" | "play" | "win" | "lose";

export type QualityLevel = "low" | "medium" | "high";

export const QUALITY_OPTIONS: Array<{ id: QualityLevel; label: string; description: string }> = [
  { id: "low", label: "BAIXO", description: "CAMADAS ESSENCIAIS. FOCO MÁXIMO EM FLUIDEZ." },
  { id: "medium", label: "MÉDIO", description: "RUÍNAS, NUVENS DE POEIRA E DETALHE EXTRA." },
  { id: "high", label: "ALTO", description: "CÉU DENSO, FAÍSCAS, PRIMEIRO PLANO E ALERTAS." },
];

export type CharacterId = "ari" | "dax";

export interface CharacterData {
  id: CharacterId;
  name: string;
  callSign: string;
  role: string;
  description: string;
  jacket: string;
  accent: string;
  speed: number;
  fireRate: number;
  grenades: number;
  maxHealth: number;
}

export const CHARACTERS: Record<CharacterId, CharacterData> = {
  ari: {
    id: "ari",
    name: "ARI VOSS",
    callSign: "BATEDORA // VENTO NORTE",
    role: "Mobilidade & precisão",
    description: "Mais rápida em terreno aberto. Dispara em rajadas curtas e mantém três granadas de pulso.",
    jacket: "#e6752a",
    accent: "#41d6d1",
    speed: 8.8,
    fireRate: 0.16,
    grenades: 3,
    maxHealth: 4,
  },
  dax: {
    id: "dax",
    name: "DAX ROOK",
    callSign: "IMPACTO // LINHA DE FERRO",
    role: "Resistência & demolição",
    description: "Mais resistente em confronto direto. Seus pulsos viajam mais rápido e carrega quatro granadas.",
    jacket: "#457ca8",
    accent: "#f1bf5d",
    speed: 7.5,
    fireRate: 0.22,
    grenades: 4,
    maxHealth: 5,
  },
};

export interface PixelPart {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  z?: number;
  tag?: string;
}

export interface Hitbox {
  x: number;
  y: number;
  halfWidth: number;
  halfHeight: number;
}
