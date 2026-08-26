# Pixel Frontier — Fase 1 Arcade Militar v4

## Gameplay
- Inimigos agora entram em ondas conforme o jogador avança.
- Soldados terrestres entram correndo pela direita.
- Drones entram pelo alto e descem para a posição de combate.
- Primeiro jipe de reforço entra no setor e desembarca 3 soldados.
- Helicóptero de ataque cruza a fase, dispara explosivos e desembarca 2 soldados.
- Segundo jipe aparece antes da reta final e desembarca mais 3 soldados.

## Direção visual
- Novo jipe militar modular com rodas, carroceria, cabine e metralhadora.
- Novo helicóptero militar modular com rotor, cockpit, foguetes e arma frontal.
- Obstáculos sci-fi foram reinterpretados como caixas de munição, tambores de combustível, ninho de metralhadora e bloqueio de concreto.
- Textos de HUD/objetivos foram ajustados para uma linguagem militar menos futurista.

## Combate e feedback
- Spritesheet de explosão agora percorre os 10 frames corretamente.
- Explosões causam screen shake curto.
- Fumaça marca chegadas de reforços e objetos destruídos.
- Soldados reforços integram o mesmo sistema de IA e pontuação dos demais inimigos.

## Estrutura
- Sistema MissionVehicle controla eventos de jipe e helicóptero.
- Inimigos possuem triggerX / entryX / entering para entrada dinâmica.
- Reforços são criados em runtime sem depender de todos os inimigos estarem previamente visíveis no cenário.
