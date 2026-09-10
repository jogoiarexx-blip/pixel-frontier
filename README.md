# Pixel Frontier v0.9.2 — HTML + JavaScript + CSS

Edição estática para navegador e GitHub Pages. Não usa React, TypeScript, Vite, Node, npm, pnpm nem processo de build.

## Publicar no GitHub Pages
1. Envie **todo o conteúdo desta pasta** para a raiz do repositório.
2. No GitHub, abra **Settings → Pages**.
3. Em **Build and deployment**, escolha **Deploy from a branch**.
4. Selecione a branch `main` e a pasta `/(root)`.
5. Salve e abra `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

O `index.html` da raiz é o jogo real. Não abra a URL `github.com/.../blob/main/index.html` para jogar.

## Estrutura
- `index.html` — entrada direta
- `css/style.css` — interface, menus e controles mobile
- `js/main.js` — bootstrap e ciclo de vida
- `js/game/` — gameplay em JavaScript ES Modules
- `js/game/systems/` — save, áudio, assets, níveis e utilitários
- `assets/` — spritesheets
- `AUDITORIA_E_CORRECOES_V1.3.0.md` — relatório da revisão técnica

## Dependência externa
BabylonJS 9.22.2 é carregado por CDN via import map. Continua sendo um site HTML/JS/CSS estático e não exige build.

## Debug
Adicione `?debug=1` ao endereço publicado para exibir FPS, resolução e DPR.


## Campanha
A versão v0.9.2 possui **12 fases/operações**, com seleção paginada, checkpoints, save e dificuldade progressiva.


## Melhorias visuais v0.9.2
- paletas mais distintas por fase
- fundos e horizonte mais ricos por tema
- elementos extras de cenário em camadas
- opção de resolução interna: AUTO, 480P, 720P, 900P e 1080P
- qualidade gráfica: AUTO, BAIXO, MÉDIO e ALTO


## Overhaul visual v0.9.2
- drone agora usa spritesheet animada
- Rover agora usa spritesheet animada
- jipe inimigo agora usa spritesheet animada
- helicóptero de ataque agora usa spritesheet animada
- resgatados agora usam spritesheet animada
- animações integradas ao movimento e ataque
- correção das portas/painéis preservada nesta base
- qualidade gráfica AUTO/BAIXO/MÉDIO/ALTO mantida
- resolução AUTO/480P/720P/900P/1080P mantida


## Atualização v1.7.0 — Level Design, Inimigos e Combate
- Fases 1–4 ganharam plataformas e armadilhas extras específicas por operação.
- Novos papéis de inimigos: rifleiro, granadeiro, metralhador, sniper e escudeiro.
- Cada papel tem HP, distância de combate, velocidade e padrão de ataque próprios.
- Reforços de jipe/helicóptero agora também podem trazer classes diferentes.
- Bosses ganharam quatro perfis de comportamento, reutilizados como famílias nas fases seguintes.
- Granadas e foguetes agora causam dano em área, dano por distância e knockback leve.
- Escudeiros reduzem dano frontal de projéteis comuns; explosivos são mais eficientes.


## Campanha narrativa v0.9.2
- 4 personagens jogáveis: Ari Voss, Dax Rook, Mika Torres e Brutus Kane
- prólogo de história antes da primeira operação
- briefing narrativo individual para as 12 fases
- chamada INICIAR MISSÃO antes do gameplay
- loading real entre operações
- cada fase possui asset de cenário próprio em `assets/stages/`
- assets exclusivos da fase anterior são liberados logicamente na troca de operação


## Versão atual
- O versionamento foi reiniciado para **v0.9.2**.
- Esta versão inclui o novo menu tático e o overhaul de sprites dos inimigos, bosses e efeitos de combate.
