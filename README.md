# Pixel Frontier v1.4.0 — HTML + JavaScript + CSS

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
A versão v1.4.0 possui **12 fases/operações**, com seleção paginada, checkpoints, save e dificuldade progressiva.
