# Pixel Frontier v1.3.0 — Auditoria e Correções

## Objetivo
Revisão técnica completa da edição HTML + JavaScript + CSS puro, mantendo publicação direta no GitHub Pages sem React, TypeScript, Vite, Node ou etapa de build.

## Bugs corrigidos

### Controles e menus
- Separação do estado de teclado, gamepad e controles virtuais para evitar uma fonte de entrada cancelar a outra.
- Gamepad agora navega menus, além de controlar o gameplay.
- Botões mobile agora funcionam também nos menus.
- Adicionado botão mobile para troca de arma.
- Tecla remapeada para trocar arma agora é respeitada.
- Inputs são limpos ao perder foco para evitar personagem andando/atirando sozinho ao voltar para a aba.
- Remapeamento duplicado é tratado de forma mais segura.

### Movimento e combate
- Agachar agora reduz de verdade a caixa de colisão do jogador.
- Segurar o botão de pulo não causa mais pulos automáticos ao tocar o chão.
- Rover agora pode ser abandonado normalmente, estaciona onde foi deixado e possui estado/HP consistente.
- Corrigido comportamento de projéteis: granada, foguete e chama não compartilham mais incorretamente a mesma física.
- Foguete não sofre mais gravidade de granada.
- Chama não herda comportamento explosivo/gravitacional indevido.
- Perfuração de projétil passou a ser uma propriedade própria.

### Checkpoint, save e reinício
- Checkpoints agora preservam score, resgates, granadas, arma, munição e estado do Rover.
- Conteúdo anterior ao checkpoint não reaparece em massa após a morte.
- Portas, switches, obstáculos, pickups, veículos, resgates e inimigos de setores anteriores são restaurados de forma coerente.
- Checkpoint de uma fase não é carregado indevidamente em outra.
- Personagem selecionado é persistido.
- Save ganhou migração para a versão 3 e proteção contra localStorage indisponível/bloqueado.

### Loading e assets
- Preload agora detecta imagem ausente/corrompida em vez de marcar falha como sucesso.
- Timeout por asset evita loading infinito.
- A tela de loading aguarda também a cena/texturas Babylon ficarem prontas antes de liberar o gameplay.
- Mensagens de erro de asset ficaram mais claras.

### Dificuldade e progressão
- Corrigido bug em que a dificuldade alterava apenas o primeiro tiro do inimigo.
- Cooldown escalado é mantido durante toda a luta, inclusive reforços, helicóptero e boss.
- Operações avançadas recebem ondas adicionais.
- Operações 4 e 5 possuem pressão aérea extra.

### Performance
- FPS de AUTO agora usa tempo real de frame, sem confundir o cap da física com desempenho real.
- Qualidade AUTO ganhou faixas mais estáveis para evitar troca constante de preset.
- Screen shake e câmera passaram a usar comportamento independente de FPS.
- Pool de efeitos de impacto, fumaça e explosões reduz criação/destruição durante combate.
- Pools são aquecidos durante a tela de loading.
- Vazamentos de materiais/texturas em reinícios foram reduzidos.

### Áudio
- Inicialização de WebAudio ficou tolerante a browsers diferentes.
- Áudio é destravado por gesto do usuário para respeitar políticas de autoplay.
- Aba em segundo plano suspende áudio.
- Volumes são limitados a faixas válidas.
- Efeitos desconhecidos possuem fallback seguro.

### GitHub Pages e inicialização
- Projeto continua 100% estático.
- `index.html` permanece na raiz.
- Paths locais continuam relativos (`./...`) e compatíveis com subpasta do GitHub Pages.
- Erro de importação do BabylonJS agora mostra tela de erro em vez de ficar preso no loading.
- Botão de recarregar funciona mesmo quando o módulo principal falha.
- Mensagem para JavaScript desativado adicionada.

## Melhorias de interface
- Menu ganhou seleção de operação/campanha com bloqueio e melhor score.
- Status de campanha aparece no menu principal.
- Textos longos dos painéis se ajustam melhor ao espaço disponível.
- HUD de debug opcional pode ser ativado com `?debug=1`.
- Aviso de orientação em celulares em modo retrato.

## Limitações que ainda são artísticas/conteúdo
- As cinco operações usam a mesma geometria-base com variações de tema/eventos; ainda não são cinco mapas totalmente exclusivos.
- Drone, Rover, jipe, helicóptero, resgatados e boa parte do cenário ainda precisam de spritesheets pixel art próprias mais detalhadas.
- Os cinco bosses ainda compartilham a base visual do Argo, embora tenham progressão/dificuldade diferentes.
- Música e efeitos são sintetizados via WebAudio; não existem trilhas/efeitos gravados dedicados.
- Explosões de foguete/granada ainda não possuem sistema completo de dano radial/AOE.
- Ainda faltam opções avançadas de acessibilidade, como intensidade do screen shake e redução de flashes.

## Validação
- Todos os arquivos JavaScript passaram em `node --check`.
- Grafo de imports locais verificado sem módulos ausentes.
- Assets referenciados verificados no pacote.
- Entrada, CSS, JavaScript principal, GameWorld e sprites testados via servidor HTTP estático local.
- O teste end-to-end completo com Chromium e CDN externo não pôde ser concluído no ambiente de trabalho por indisponibilidade de DNS externo; por isso a dependência BabylonJS permaneceu fixada na versão já usada pelo projeto, evitando uma atualização de biblioteca não testada.
