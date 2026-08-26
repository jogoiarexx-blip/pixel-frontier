# Direção de design — Pixel Frontier

## Três abordagens visuais

### 1. **Fronteira de Cobre**

**Muito breve:** Uma campanha de ação em um planeta desértico-industrial, com máquinas de cobre, céu azul-petróleo e poeira ocre. A estética une quadrinhos de aventura dos anos 1990 a pixel art 16-bit de alto contraste.

**Probabilidade:** 0.07

### 2. **Maré de Ferrugem**

**Muito breve:** Um porto tomado por sucata e tempestades, com navios mecânicos e paleta de ferrugem profunda. O tom é mais melancólico, com ação rápida iluminada por relâmpagos e alarmes.

**Probabilidade:** 0.03

### 3. **Selva de Vidro**

**Muito breve:** Uma expedição atravessa ruínas bioluminescentes e laboratórios escondidos sob a mata. A vegetação esmeralda e as luzes de pesquisa criam uma aventura de exploração mais mística.

**Probabilidade:** 0.09

## Abordagem escolhida: Fronteira de Cobre

### Movimento de design

**Pixel art 16-bit de aventura militar alternativa**, inspirado pela expressividade de sprites de arcades da era 16-bit e por ilustrações de ficção científica de revistas pulp, sem reproduzir personagens, marcas ou cenários de franquias existentes.

### Princípios centrais

1. **Silhuetas legíveis antes de detalhes:** personagens, projéteis, inimigos e veículos devem ser reconhecidos em poucos pixels e em movimento.
2. **Ação em camadas:** o cenário deve apresentar fundo distante, ruínas intermediárias e elementos frontais, reforçando a profundidade sem comprometer a leitura do plano jogável.
3. **Exagero físico controlado:** recuo de armas, poeira, faíscas e explosões têm personalidade de desenho animado, mas não escondem ameaças.
4. **Interface como equipamento de campo:** menus, barras e avisos parecem impressos em um terminal militar de expedição, não painéis genéricos de aplicativo.

### Filosofia de cor

O mundo será quente e mineral: **cobre queimado**, areia pálida, azul-petróleo e azul elétrico limitado aos elementos tecnológicos. O contraste entre o céu frio e a terra quente destaca personagens e tiros sem recorrer a gradientes roxos ou neon excessivo.

### Paradigma de layout

O jogo ocupa toda a janela como uma tela de fliperama. Menus e seleção de personagem são compostos como **painéis de briefing assimétricos**, com grandes ilustrações à esquerda, opções escalonadas à direita e linhas diagonais que evocam mapas táticos. Durante a missão, o HUD usa uma faixa superior compacta e cartões discretos nos cantos, preservando a área de ação.

### Elementos de assinatura

- **Faixas diagonais âmbar** usadas em transições, cartões selecionados e placas de perigo.
- **Emblema de bússola quebrada** que representa a unidade exploradora e vira ícone do jogo.
- **Poeira em pixels quadrados** que acompanha corrida, aterrissagem e veículos.

### Filosofia de interação

As opções respondem como um painel de campo: destaque rápido, som imaginado por impacto visual e avanço imediato. Os controles são exibidos no contexto em que serão usados; cada ação do jogador produz retorno visual curto e forte.

### Animação

Animações de interface usam entradas rápidas de 160–240 ms, com deslocamentos curtos horizontais e opacidade. No jogo, sprites trabalham com ciclos curtos e “squash” leve em pousos; explosões usam expansão em 2–3 pulsos. Todos os movimentos respeitam `prefers-reduced-motion` no menu.

### Tipografia

**Bungee** para títulos e placares, com formas largas e arcade; **Space Mono** para coordenadas, status e instruções. A hierarquia é condensada e em caixa alta, com descrições curtas em monoespaçado para transmitir função de briefing.

### Essência da marca

**Pixel Frontier é uma expedição run-and-gun de alto impacto para quem quer dominar uma missão arcade curta, cheia de máquinas hostis e rotas de resgate.** Personalidade: **resoluta, vibrante, mecânica**.

### Voz da marca

Manchetes e CTAs soam como ordens de uma equipe em campo: diretos, específicos e energéticos, sem frases genéricas.

Exemplos: “A tempestade fechou a rota. Abra caminho.”

“Escolha um batedor. Recupere o núcleo. Volte inteiro.”

### Logotipo e símbolo

O símbolo é uma **bússola de quatro pontas partida por uma trilha de esteira**, com um sol quadrado no horizonte. O wordmark usa letras geométricas angulares, cortadas por uma linha de trajetória, e nunca uma fonte-padrão sem tratamento.

### Cor de marca

**Cobre de Impacto — `#E6752A`**. É a cor de seleção, do emblema, das faíscas e dos avisos decisivos.

## Escopo jogável da primeira versão

Uma missão horizontal curta e original chamada **Operação: Núcleo Vazio**. O jogador seleciona entre **Ari Voss**, uma batedora rápida, e **Dax Rook**, um especialista de impacto. A missão inclui correr, saltar, atirar, lançar granadas, resgatar exploradores, entrar no veículo **Rover-9**, derrotar sentinelas mecânicas e enfrentar o chefe **Escavador Argo**. O menu inclui Iniciar Missão, Manual e Créditos; o jogo inclui HUD de vida, granadas, arma e resgates, além de retorno ao menu após vitória ou derrota.

## Style Decisions

- Todo estado de repouso deve exibir ao menos um sinal inequívoco da Fronteira de Cobre: emblema de bússola quebrada, barras de perigo diagonais, silhueta em pixels ou painel de campo.
- O azul-petróleo é sempre contrastado com Cobre de Impacto e ocre de poeira, tanto nos menus como nos campos de batalha.
- Menu, seleção, HUD e chefe carregam papéis distintos de console de missão: lançamento, dossiê, telemetria ao vivo e alerta de ameaça pesada.
