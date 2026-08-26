# Pixel Frontier — revisão arcade militar

## Alterações aplicadas
- Personagens externos estáticos substituídos por arte modular animável.
- Protagonistas com bandana, colete, mochila, rifle, carregador, botas e muzzle flash.
- Soldados inimigos redesenhados com uniforme, capacete e rifle.
- Drones redesenhados em estética militar industrial.
- Rover convertido em veículo blindado de guerra.
- Boss redesenhado como máquina de cerco com esteiras, canhão, broca, blindagem e fumaça de dano.
- Cenário sci-fi geométrico trocado por zona de guerra com ruínas, barricadas, sacos de areia, caixas, tambores, postes e escombros.
- Câmera aproximada para destacar personagem e combate.
- Quantidade de inimigos aumentada de 6 para 12.
- Soldados passam a avançar para distância de combate.
- Disparos receberam aparência de bala e flashes de impacto.
- Explosões, faíscas e fumaça adicionadas a inimigos e objetos destruídos.
- Boss apresenta fumaça visual quando entra em estado danificado.
- Terminologia da missão alterada para "Linha de Fogo" para combinar com a nova direção.

## Observação técnica
O projeto original usava `return assetSprite(...)` antes da definição modular dos personagens e inimigos. Isso impedia que o sistema de animação por tags (`leg-front`, `leg-back`, `wheel-left` etc.) encontrasse as partes visuais. A revisão remove essa limitação usando sprites modulares reais.
