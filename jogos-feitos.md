# ✅ Jogos Feitos

Histórico de mini-jogos já implementados e registrados (backend + frontend).

> As entradas aqui são **movidas** de `jogos-pra-criar.md` quando um jogo é concluído.
> Cada entrada mantém a especificação original mais data, arquivos tocados e comportamento
> de skip documentado.

---

## Como documentar um jogo concluído

Ao finalizar a implementação, **mova** a entrada de `jogos-pra-criar.md` para cá (mais
recentes no topo) e preencha:

- Todos os campos da especificação original
- **Tempos de espera** — cada fase com timer e como pular
- **Data de conclusão** (`AAAA-MM-DD`)
- **Arquivos** — paths do backend, frontend e registry

Use o template abaixo como referência.

---

## Template (jogo concluído)

```markdown
### <Nome do Jogo>
- **id:** `snake_case_id`
- **concluído em:** AAAA-MM-DD
- **jogadores:** min X / max Y
- **duração estimada:** Z segundos
- **complexidade:** ⭐ / ⭐⭐ / ⭐⭐⭐

**Como funciona (regras):**
- ...

**Ações do jogador (`GameAction`):**
- ...

**Lógica do servidor (`MiniGameEngine`):**
- ...

**UI / telas (frontend):**
- ...

**Tempos de espera (puláveis):**
- ...

**Arquivos:**
- `minigames-backend/src/games/...`
- `minigames-frontend/src/games/.../`
- `minigames-backend/src/games/registry.ts`
- `minigames-frontend/src/App.tsx`
```

---

### Number Guessing
- **id:** `number_guessing`
- **status:** ✅ feito
- **concluído em:** 2026-06-09
- **jogadores:** min 2 / max 8
- **duração estimada:** 60 segundos
- **complexidade:** ⭐

**Como funciona (regras):**
- O servidor sorteia um número secreto entre 1 e 100.
- Jogadores enviam palpites; o servidor responde "maior" ou "menor" para cada palpite.
- Quem acertar o número primeiro ganha a ronda.
- Se o tempo de 60s acabar sem acerto, ninguém pontua na ronda.

**Por que encaixa nos critérios (GAME-IDEAS.md):**
- Delay não afeta (cada palpite é avaliado individualmente); regra simples; ronda rápida.

**Ações do jogador (`GameAction`):**
- `type: "guess"` → payload: número do palpite (1–100)
- `type: "skip"` → sem payload; pula a tela de resultado (fase `results`)

**Lógica do servidor (`MiniGameEngine`):**
- Estado: `secretNumber`, histórico de palpites, `roundCountdown`, `winnerPlayerId`, `noWinner`.
- Fases: `guessing` → `results` → `ended`.
- Fim de ronda (`checkRoundEnd`): quando `status === "ended"`.
- Pontuação: primeiro a acertar recebe o ponto; timeout com `noWinner: true` não incrementa placar.
- Edge cases: palpites fora do intervalo ignorados; número secreto só revelado em `results`/`ended`.

**UI / telas (frontend):**
- `guessing`: input numérico, banner higher/lower, timer e histórico dos próprios palpites.
- `results`: revela o número secreto e mensagem de vitória ou timeout.

**Tempos de espera (puláveis):**
- Timer global (60s): encerra **na hora** quando alguém acerta (sem esperar o resto do tempo).
- Tela de resultado (5s): botão **Pular** envia `skip` e avança para `ended`.

**Arquivos:**
- `minigames-backend/src/games/number-guessing.ts`
- `minigames-frontend/src/games/number-guessing/index.tsx`
- `minigames-frontend/src/games/number-guessing/styles.css`
- `minigames-backend/src/games/registry.ts`
- `minigames-frontend/src/App.tsx`
- `minigames-backend/src/events.ts` (rondas sem vencedor não incrementam placar)

**Notas:**
- Variação futura: revelar palpites dos outros jogadores para criar tensão.

---

### Higher or Lower
- **id:** `higher_lower`
- **concluído em:** 2026-06-09
- **jogadores:** min 2 / max 8
- **duração estimada:** 25 segundos
- **complexidade:** ⭐⭐

**Como funciona (regras):**
- O servidor sorteia um número atual (1–100) e já define o próximo (sempre diferente).
- Na fase de voto, cada jogador escolhe se o próximo será **maior** ou **menor**.
- Após a votação, revela os dois números e a direção real (subiu/desceu).
- Quem acertou a direção ganha 1 ponto na ronda; se vários acertam, um é sorteado como
  vencedor da ronda para o placar geral.

**Ações do jogador (`GameAction`):**
- `type: "vote"` → payload: `"higher"` ou `"lower"`
- `type: "skip"` → sem payload; pula a tela de resultado (fase `results`)

**Lógica do servidor (`MiniGameEngine`):**
- Estado: `currentNumber`, `nextNumber`, votos por jogador, `voteCountdown`, `results`.
- Fases: `voting` → `results` → `ended`.
- Fim de ronda (`checkRoundEnd`): quando `status === "ended"`.
- Pontuação: jogadores que votaram na direção correta entram no pool de vencedores.
- Edge cases: votos ignorados fora da fase `voting`; empate sem acertos = sem vencedor de
  ponto (fallback para primeiro jogador no placar da ronda).

**UI / telas (frontend):**
- `voting`: número atual, botões Higher/Lower, timer e progresso de votos.
- `results` / `ended`: reveal dos números, breakdown de votos, mensagem de vencedores.

**Tempos de espera (puláveis):**
- Countdown de voto (12s): encerra **na hora** quando todos votaram.
- Tela de resultado (5s): botão **Pular** envia `skip` e avança para `ended`.

**Arquivos:**
- `minigames-backend/src/games/higher-lower.ts`
- `minigames-frontend/src/games/higher-lower/index.tsx`
- `minigames-frontend/src/games/higher-lower/styles.css`
- `minigames-backend/src/games/registry.ts`
- `minigames-frontend/src/App.tsx`

---

### Would You Rather
- **id:** `would_you_rather`
- **concluído em:** 2026-06-09
- **jogadores:** min 2 / max 8
- **duração estimada:** 30 segundos
- **complexidade:** ⭐

**Como funciona (regras):**
- Uma pergunta "Você prefere A ou B?" é sorteada do banco `QUESTIONS`.
- Jogadores votam em A ou B dentro do tempo.
- A opção com **maioria** vence; quem votou na maioria ganha 1 ponto.
- Em caso de empate, ninguém pontua na ronda.

**Ações do jogador (`GameAction`):**
- `type: "vote"` → payload: `"A"` ou `"B"`
- `type: "skip"` → sem payload; pula a tela de resultado (fase `results`)

**Lógica do servidor (`MiniGameEngine`):**
- Estado: pergunta atual, votos, `voteCountdown`, `results`.
- Fases: `voting` → `results` → `ended`.
- Fim de ronda (`checkRoundEnd`): quando `status === "ended"`.
- Pontuação: maioria define vencedores; empate = array de vencedores vazio.
- Edge cases: jogador pode trocar o voto antes do fim da fase `voting`.

**UI / telas (frontend):**
- `voting`: duas opções clicáveis, timer e progresso de votos.
- `results`: barras com contagem de votos e mensagem de vitória/empate.

**Tempos de espera (puláveis):**
- Countdown de voto (15s): encerra **na hora** quando todos votaram.
- Tela de resultado (5s): botão **Pular** envia `skip` e avança para `ended`.

**Arquivos:**
- `minigames-backend/src/games/would-you-rather.ts`
- `minigames-frontend/src/games/would-you-rather/index.tsx`
- `minigames-frontend/src/games/would-you-rather/styles.css`
- `minigames-backend/src/games/registry.ts`
- `minigames-frontend/src/App.tsx`

---

### Reaction Time
- **id:** `reaction_time`
- **concluído em:** 2026-06-09
- **jogadores:** min 2 / max 8
- **duração estimada:** 10 segundos
- **complexidade:** ⭐

**Como funciona (regras):**
- Tela vermelha (`ready`): jogadores aguardam o sinal — o verde aparece após delay
  aleatório (2–5s). Clicar antes do verde = penalidade (tempo -1).
- Tela verde (`green`): primeiro clique válido registra o tempo de reação.
- Vence quem teve o menor tempo de reação válido; se todos clicaram cedo, usa fallback.

**Ações do jogador (`GameAction`):**
- `type: "click"` → sem payload; registra clique na fase atual
- `type: "skip"` → sem payload; na fase `green`, se o jogador já respondeu, encerra a
  ronda imediatamente (pula a espera pelos demais)

**Lógica do servidor (`MiniGameEngine`):**
- Estado: `status`, `responses` (playerId → tempo em ms ou -1 se cedo demais).
- Fases: `ready` → `green` → `ended`.
- Fim de ronda (`checkRoundEnd`): todos responderam, timeout de 3s após o verde, ou `skip`
  com resposta já registrada.
- Pontuação: menor tempo válido (> 0) vence a ronda.

**UI / telas (frontend):**
- Fundo muda de cor por fase (vermelho → verde → cinza).
- Mensagem contextual e contador de jogadores restantes.

**Tempos de espera (puláveis):**
- Delay aleatório antes do verde (2–5s): **não pulável** — faz parte da mecânica do jogo.
- Espera após clicar no verde (até 3s ou todos responderem): encerra quando todos
  responderam; quem já clicou pode **Pular** para forçar o fim da ronda.
- Sem tela de resultado prolongada — transição rápida para `round_ended`.

**Arquivos:**
- `minigames-backend/src/games/reaction-time.ts`
- `minigames-frontend/src/games/reaction-time/index.tsx`
- `minigames-frontend/src/games/reaction-time/styles.css`
- `minigames-backend/src/games/registry.ts`
- `minigames-frontend/src/App.tsx`
