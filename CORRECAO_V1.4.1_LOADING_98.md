# Pixel Frontier v1.4.1 — correção do loading em 98%

## Bug corrigido
A tela de loading podia ficar parada em 98% na mensagem "ENVIANDO TEXTURAS PARA GPU".

A causa era a espera sem limite por `scene.whenReadyAsync()` do BabylonJS. Em alguns navegadores e combinações de cache/CDN/GPU, um recurso pode permanecer marcado como não-pronto, fazendo essa Promise nunca terminar.

## Correção
- O preload de imagens continua validando todos os arquivos antes da missão.
- A etapa de prontidão da GPU agora possui timeout de segurança de 3,2 segundos.
- Se o Babylon confirmar antes, o jogo segue normalmente.
- Se não confirmar, a missão é liberada e recursos restantes terminam de preparar no render loop.
- O jogo não fica mais preso indefinidamente em 98%.
- Foram adicionados avisos de diagnóstico no console para identificar demora de GPU sem impedir a partida.

## Validação
- Todos os arquivos JavaScript passaram em verificação de sintaxe.
- Nenhum import local quebrado.
- Nenhum asset referenciado ausente.
- index.html, CSS, JS principal, GameWorld e sprites principais retornaram HTTP 200 em servidor estático.

Versão: 1.4.1
