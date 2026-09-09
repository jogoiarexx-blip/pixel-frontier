# Auditoria de jogabilidade — Pixel Frontier v1.4.2

## Correções críticas aplicadas
- Checkpoints que ficam entre um console e a porta correspondente agora restauram **console + porta** no estado correto. Antes, morrer após alguns checkpoints podia deixar a porta fechada e o console já consumido, bloqueando a fase.
- A hitbox do boss agora acompanha o movimento horizontal real do boss.
- A transição de fase preserva o identificador da fase anterior até o `startMission`, permitindo liberar corretamente o estado lógico de assets da operação anterior.

## Integridade da campanha
- 12 níveis definidos.
- 3 checkpoints por nível, em ordem e dentro dos limites da missão.
- Temas visuais presentes para as 12 operações.
- Ondas extras configuradas para as operações 2–12.
- Boss e condição de vitória presentes em todas as operações.
- Desbloqueio e avanço para a próxima operação configurados.

## Observação importante
As 12 operações são jogáveis sobre a mesma rota-base de terreno/portas/boss, com temas, estatísticas, ondas e reforços diferentes. Elas ainda não são 12 mapas totalmente autorais e independentes.
