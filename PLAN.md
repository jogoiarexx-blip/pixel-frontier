# Game Plan: Pixel Frontier

## Risk Tasks

### 1. Movimento, salto e transições de estado
- **Why isolated:** A sensação de um run-and-gun depende de transições nítidas entre correr, pular, atirar, pousar e sofrer dano.
- **Approach:** Usar física cinemática simples em uma cena ortográfica 2D, com estados explícitos para o personagem e gravidade própria; não haverá física de rodas nem navegação dinâmica.
- **Verify:** Esquerda/direita correspondem ao movimento, pulo termina em pouso sem atravessar o chão, ataque não interrompe a leitura de corrida, e o personagem não fica preso em bordas.

### 2. Colisão entre projéteis, inimigos, resgates e chefe
- **Why isolated:** O jogo usa múltiplos objetos móveis e o dano deve ser legível sem uma camada física complexa.
- **Approach:** Usar caixas 2D simples e atualização por quadro em coordenadas de mundo; os projéteis são dados leves e reutilizáveis visualmente.
- **Verify:** Tiros acertam inimigos da direção correta, granadas explodem, resgates só contam uma vez, veículo protege o jogador e o chefe recebe dano visível.

### 3. Animação procedural em linguagem 16-bit
- **Why isolated:** Sem uma folha de sprites gerada, as poses e efeitos precisam manter leitura de pixel art sem parecerem vetoriais ou suaves demais.
- **Approach:** Construir sprites a partir de módulos com bordas duras, resolução interna baixa e escalonamento sem suavização; usar ciclos curtos de deslocamento e “squash” apenas em pousos e explosões.
- **Verify:** Personagens, sentinelas, veículo e chefe mantêm silhueta clara em movimento e não exibem interpolação borrada.

## Main Build

Criar uma tela completa em Babylon com menu inicial, tela de seleção entre Ari Voss e Dax Rook, manual contextual, missão de rolagem lateral, HUD, resgates, armas, granadas, veículo Rover-9, sentinelas e chefe Escavador Argo. Incluir `?demo` para iniciar uma demonstração determinística na missão.

- **Assets needed:** referência visual de pixel art 16-bit; logo de bússola; sprites originais para dois personagens, sentinela, drone, veículo, chefe, projéteis, explosões, trabalhadores resgatados e fundo desértico-industrial. Como a cota de geração de imagens está temporariamente indisponível, a primeira versão criará equivalentes originais com geometria 2D modular e paleta limitada, documentados em `ASSETS.md`.
- **Verify:**
  - Os comandos respondem imediatamente e a direção de movimento é correta.
  - A seleção de personagem altera atributos e aparência do herói.
  - O HUD permanece legível sem cobrir a ação.
  - O jogador pode eliminar sentinelas, resgatar exploradores, entrar no Rover-9 e derrotar o chefe.
  - Vitória, derrota e retorno ao menu funcionam.
  - `?demo` exibe um instante representativo de missão em captura.
  - Não há erros de TypeScript ou de console durante a captura.

