# Estrutura técnica — Pixel Frontier

O React fornece apenas o canvas de tela cheia. Babylon controla o render ortográfico 2D, as camadas de fundo, as entidades e o loop. A lógica de jogo ficará em módulos TypeScript sem dependência de React.

```text
client/src/
  components/GameCanvas.tsx       # ciclo de vida do Engine
  game/scene.ts                   # criação e descarte da cena
  game/GameWorld.ts               # estado de menu e missão, loop e entidades
  game/entities.ts                # jogador, inimigo, resgate, veículo, chefe e projéteis
  game/pixelArt.ts                # primitivas visuais 16-bit e materiais
  game/ui.ts                      # HUD, menu, seleção e telas de fim
  game/types.ts                   # tipos compartilhados e dados dos personagens
```

O plano usa uma câmera ortográfica lateral fixa. O mundo tem coordenadas em pixels lógicos e sprites montados como grupos de retângulos 2D. Uma resolução interna baixa é escalonada sem suavização para preservar a leitura de 16 bits. Colisões são retangulares, deliberadamente simples e previsíveis.

Os perfis gráficos são controlados pelo estado `QualityLevel`. **Baixo** mantém a geometria indispensável de jogo; **Médio** habilita faixas de nuvem e ruínas mecânicas; **Alto** acrescenta partículas de poeira animadas, tubulações de primeiro plano e maior profundidade de cena. A preferência é salva localmente e também pode ser verificada com o parâmetro `?quality=low|medium|high`.

Os sprites modulares agora usam partes nomeadas, permitindo ciclos curtos de pernas, rodas, asas, broca, pulso de dano e clarão de disparo. A lógica de colisão é mantida em `GameWorld` por caixas `Hitbox` independentes da arte: jogador e Rover-9 possuem áreas próprias, inimigos distinguem torre e drone, granadas registram os alvos já atingidos e o Escavador Argo usa uma área de núcleo separada de seus elementos decorativos.

O mapa interativo usa duas camadas de física simples em `GameWorld`: `TerrainSurface` descreve topos de plataformas unidirecionais para queda e pouso, enquanto `TerrainObstacle` descreve barreiras sólidas com hitbox, pontos de vida e estado ativo. Tiros e granadas podem destruir carga, obeliscos e anteparos marcados, removendo sua geometria e liberando a rota; bloqueios estruturais permanecem sólidos e exigem salto.

O sistema de segurança acrescenta `SecuritySwitch`, `SecurityDoor` e `GroundTrap`. Cada console guarda o identificador de uma porta específica e só libera esse portão quando o jogador ativa `E` dentro de sua hitbox. Portas fechadas entram na resolução lateral do terreno e bloqueiam projéteis; ao abrir, sobem para fora da rota. Armadilhas possuem hitbox independente, intervalo de dano e usam a invulnerabilidade existente para impedir impactos repetidos a cada quadro.

Os assets externos usam mapeamento UV vertical corrigido (`vScale = -1`, `vOffset = 1`) para que a origem da imagem coincida com o eixo Y do plano Babylon. Cada asset também recebe uma âncora vertical própria: batedores, Rover-9 e Escavador Argo mantêm os pés ou esteiras no topo do terreno, enquanto as hitboxes acompanham o centro útil do corpo em vez da base do sprite.
