# Publicar o Pixel Frontier no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie **todo o conteúdo desta pasta** para a branch `main`.
3. No GitHub, abra **Settings > Pages**.
4. Em **Build and deployment > Source**, selecione **GitHub Actions**.
5. Abra a aba **Actions** e acompanhe `Deploy Pixel Frontier to GitHub Pages`.
6. Quando o workflow terminar com sucesso, o endereço do jogo aparecerá na página do deploy e em **Settings > Pages**.

## Atualizações

Depois da primeira configuração, qualquer novo `push` para a branch `main` recompila e publica o jogo automaticamente.

## Observação

O projeto usa `base: "./"`, portanto funciona tanto em um domínio `usuario.github.io` quanto em um projeto `usuario.github.io/nome-do-repositorio/`, sem precisar editar o nome do repositório no Vite.
