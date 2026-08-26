# Assets — Pixel Frontier

**Direção artística:** pixel art de 16 bits de aventura militar alternativa, usando cobre queimado, areia clara, azul-petróleo, carvão e pequenos acentos em azul elétrico. Fundo em três camadas parallax; sprites de silhueta forte, contorno escuro e grupos de pixels sem anti-aliasing.

| Recurso | Papel | Situação |
|---|---|---|
| Referência de fase 16:9 | QA de composição, paleta e escala | Geração solicitada; indisponível por limite diário. |
| Emblema de bússola quebrada | Marca e favicon | Será construído em geometria 2D modular. |
| Ari Voss | Batedora rápida | Sprite modular original. |
| Dax Rook | Especialista de impacto | Sprite modular original. |
| Sentinela e drone | Inimigos de base | Sprites modulares originais. |
| Rover-9 | Veículo de apoio | Sprite modular original. |
| Escavador Argo | Chefe mecânico | Sprite modular original. |
| Mesas, ruínas e poeira | Fundo e efeitos | Geometria 2D modular em paleta limitada. |
| Sprites de estado | Movimento, disparo e dano | Partes nomeadas originais: pernas, botas, asas, rodas, broca e clarões. |
| Batedores Ari e Dax | Personagens jogáveis | PNG externo em pixel art 16-bit, com paletas cobre e azul-petróleo distintas. |
| Sentinela, drone, Rover-9 e Escavador Argo | Atores de combate | PNGs externos originais, com silhuetas mecânicas mais detalhadas. |
| Kit industrial | Cenário de missão | Painéis, terminais e suportes modulares em PNG para enriquecer plataformas e postos. |

Nenhum arquivo visual externo será usado até que haja uma arte original gerada disponível. A primeira versão preserva o estilo por meio de pixelagem e paleta limitada programáticas.

Uma nova geração de folhas de sprites foi solicitada nesta atualização, mas a cota diária gratuita já estava no limite. Os sprites originais foram, por isso, ampliados em geometria 16-bit modular, sem reutilizar recursos externos.

Os assets externos atuais foram desenhados como vetores de pixel art originais, convertidos em PNG com bordas nítidas e enviados ao armazenamento do projeto. O Babylon foi excluído da pré-otimização do Vite para que seus shaders internos e os novos materiais de textura carreguem de forma estável.
