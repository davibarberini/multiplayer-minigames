# 🎮 Jogos pra Criar (Backlog)

Lista de mini-jogos planejados para implementar neste repositório. Cada entrada é uma
"especificação leve" de uma ideia de jogo, pronta para virar código seguindo o
`DEVELOPMENT-GUIDE.md`.

> Este arquivo serve de **fila de trabalho** para o comando `/criar-da-lista`, que lê a próxima
> entrada com status `🔲 a fazer`, implementa o jogo, **documenta** o jogo concluído em
> `jogos-feitos.md` e **remove** a entrada da fila abaixo.

---

## Como usar

1. Adicione uma nova ideia copiando o **Template** abaixo.
2. Preencha todos os campos (quanto mais completo, menos o agente precisa "adivinhar").
3. Use `id` em `snake_case` (ex.: `trivia_quiz`) — é o `gameId` usado no `GAME_REGISTRY`,
   no `App.tsx` e no nome das pastas.
4. Mantenha o `status` atualizado conforme o jogo avança.
5. **Tempos de espera puláveis** — em todo jogo novo, documente cada fase com timer ou pausa
   e como o jogador pode pular (botão "Pular", fim antecipado quando todos agiram, etc.).
   Ver `DEVELOPMENT-GUIDE.md` → *Skippable Wait Times*.
6. **Ao concluir** — mova a entrada para `jogos-feitos.md` (seção no topo), preenchendo
   data, arquivos tocados e a seção **Tempos de espera (puláveis)** com o que foi
   implementado de fato.

### Legenda de status
- 🔲 **a fazer** — ainda não implementado
- 🚧 **em progresso** — sendo implementado
- ✅ **feito** — implementado e registrado (backend + frontend)
- ❌ **descartado** — decidimos não fazer

### Legenda de complexidade
- ⭐ Baixa · ⭐⭐ Média · ⭐⭐⭐ Alta (ex.: precisa validação de palavras, banco de dados grande)

---

## Template (copie para criar uma nova ideia)

```markdown
### <Nome do Jogo>
- **id:** `snake_case_id`
- **status:** 🔲 a fazer
- **prioridade:** alta | média | baixa
- **jogadores:** min X / max Y
- **duração estimada:** Z segundos (vira `estimatedDuration` no config)
- **complexidade:** ⭐ / ⭐⭐ / ⭐⭐⭐

**Como funciona (regras):**
- (passo a passo da jogabilidade, do começo ao fim de uma ronda)

**Por que encaixa nos critérios (GAME-IDEAS.md):**
- (tolerante a delay? multiplayer? ronda curta? fácil de entender?)

**Ações do jogador (`GameAction`):**
- `type: "..."` → payload: `...` (o que o cliente envia ao servidor)

**Lógica do servidor (`MiniGameEngine`):**
- Estado: (o que o servidor guarda por ronda — ex.: respostas, votos, tempos)
- Fim de ronda (`checkRoundEnd`): (quando termina e como)
- Pontuação / vencedor: (como o ponto é atribuído — sempre server-side)
- Edge cases: (desconexão, timeout, ação fora de hora, empate)

**UI / telas (frontend):**
- (estados visuais: ex.: "votando", "resultado"; o que mostrar em cada um)

**Tempos de espera (obrigatório — devem ser puláveis):**
- (liste cada fase com espera: ex. countdown de voto 12s, tela de resultado 5s)
- (como pular cada uma: botão "Pular", todos votaram → encerra na hora, etc.)
- (ação no servidor, se houver: ex. `type: "skip"` na fase de resultados)

**Dados necessários:**
- (ex.: banco de perguntas, lista de palavras, categorias — onde colocar)

**Notas:**
- (qualquer detalhe extra, inspirações, variações futuras)
```

---

## Fila de jogos

### Trivia Quiz
- **id:** `trivia_quiz`
- **status:** 🔲 a fazer
- **prioridade:** alta
- **jogadores:** min 2 / max 8
- **duração estimada:** 90 segundos
- **complexidade:** ⭐⭐

**Como funciona (regras):**
- Uma pergunta de múltipla escolha aparece para todos.
- Cada jogador tem 10-15s para escolher uma alternativa.
- Resposta correta = 1 ponto; quem acerta mais rápido ganha pontos extras.
- Após o tempo, mostra a resposta certa e a contagem de pontos da ronda.

**Por que encaixa nos critérios (GAME-IDEAS.md):**
- Todos têm o mesmo tempo, então delay de rede não prejudica ninguém.
- Funciona bem com vários jogadores e a ronda é curta.

**Ações do jogador (`GameAction`):**
- `type: "answer"` → payload: índice da alternativa escolhida (ex.: `0..3`).

**Lógica do servidor (`MiniGameEngine`):**
- Estado: pergunta atual, alternativas, índice correto, respostas por jogador (com timestamp).
- Fim de ronda (`checkRoundEnd`): quando todos responderam OU o tempo acabou.
- Pontuação / vencedor: acerto = 1 ponto + bônus por velocidade; vencedor da ronda = maior pontuação.
- Edge cases: jogador que não responde fica com 0; ignorar respostas após o tempo; desconexão não trava a ronda.

**UI / telas (frontend):**
- Estado "perguntando": enunciado + alternativas clicáveis + contador regressivo.
- Estado "resultado": destaca a alternativa correta e mostra quem acertou.

**Tempos de espera (obrigatório — devem ser puláveis):**
- Countdown de resposta (10–15s): encerrar quando todos responderam.
- Tela de resultado: botão **Pular** (`type: "skip"`) para avançar sem esperar.

**Dados necessários:**
- Banco de perguntas (enunciado, alternativas, índice correto). Sugestão: array constante no
  arquivo do jogo no backend (como o `QUESTIONS` de `would-you-rather.ts`).

**Notas:**
- Dá pra expandir com categorias e níveis de dificuldade depois.

---

<!-- Adicione novas ideias abaixo usando o Template -->
