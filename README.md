# Pixel Frontier — HTML + JavaScript + CSS

Esta edição não usa React, TypeScript, Vite, Node, npm, pnpm ou processo de build.

## GitHub Pages
1. Envie todos os arquivos desta pasta para a raiz do repositório.
2. No GitHub: **Settings → Pages**.
3. Em **Build and deployment**, selecione **Deploy from a branch**.
4. Branch: `main` e pasta: `/(root)`.
5. Salve e abra `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

O `index.html` da raiz é o jogo real.

## Estrutura
- `index.html` — entrada direta
- `css/style.css` — interface e controles mobile
- `js/main.js` — bootstrap do jogo
- `js/game/` — gameplay em JavaScript ES Modules
- `assets/` — sprites

## Dependência externa
BabylonJS 9.22.2 é carregado por CDN via import map. Isso continua sendo HTML/JS/CSS estático e não exige build.
