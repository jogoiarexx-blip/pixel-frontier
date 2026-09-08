# Conversão para HTML + JavaScript + CSS puro

## Removido
- React / ReactDOM
- TypeScript / TSX em runtime
- Vite
- Node.js / Express
- npm / pnpm
- package.json / lockfile
- pasta dist
- build do GitHub Actions

## Mantido
- gameplay e sistemas da v1.1.0
- BabylonJS/WebGL
- spritesheets
- campanha de 5 operações
- loading interno
- save/checkpoint
- armas e munição
- pause
- áudio
- gamepad e controles touch
- opções gráficas/dificuldade

## Publicação
O GitHub Pages deve usar **Deploy from a branch**, branch `main`, pasta `/(root)`.
O arquivo servido é `index.html` na raiz.

BabylonJS é importado como ES Module via UNPKG. Não há etapa de compilação.
