# 🎮 Ideias de Mini-Jogos

## Critérios para Escolha
- ✅ **Não depende de input instantâneo** (tolerante a delay)
- ✅ **Funciona bem com múltiplos jogadores**
- ✅ **Rondas rápidas** (2-5 minutos)
- ✅ **Fácil de entender**
- ✅ **Divertido e competitivo**
- ✅ **Esperas puláveis** — timers e telas de resultado devem ter botão "Pular" ou encerrar
  cedo quando todos já agiram (ver `DEVELOPMENT-GUIDE.md`)

---

## 🎯 Sugestões de Jogos

### 1. **Trivia Quiz** ⭐ RECOMENDADO
**Como funciona:**
- Pergunta aparece na tela
- Todos têm 10-15 segundos para responder
- Resposta correta = 1 ponto
- Mais rápido = pontos extras
- Vence quem tem mais pontos no final

**Por que funciona bem:**
- ✅ Tempo suficiente para pensar e responder
- ✅ Delay não afeta (todos têm o mesmo tempo)
- ✅ Educativo e divertido
- ✅ Fácil de implementar

**Complexidade:** ⭐⭐ (Média)

---

### 2. **Word Chain / Palavras Conectadas**
**Como funciona:**
- Primeira palavra aparece
- Jogadores precisam escrever uma palavra que começa com a última letra
- Exemplo: "GATO" → "OVO" → "ORELHA" → "ABACAXI"
- Primeiro a responder corretamente ganha o ponto
- Palavras repetidas não valem

**Por que funciona bem:**
- ✅ Turnos não simultâneos (um de cada vez)
- ✅ Delay não importa
- ✅ Estimula criatividade
- ✅ Funciona em qualquer idioma

**Complexidade:** ⭐⭐⭐ (Alta - precisa validação de palavras)

---

### 3. **Number Guessing / Adivinhação**
**Como funciona:**
- Sistema escolhe um número (ex: 1-100)
- Jogadores fazem palpites
- Sistema diz "maior" ou "menor"
- Quem acertar primeiro ganha

**Por que funciona bem:**
- ✅ Turnos claros
- ✅ Delay não afeta
- ✅ Estratégia simples
- ✅ Muito fácil de implementar

**Complexidade:** ⭐ (Baixa)

---

### 4. **Would You Rather / Você Preferia**
**Como funciona:**
- Pergunta aparece: "Você prefere A ou B?"
- Todos votam simultaneamente
- Maioria ganha 1 ponto
- Se empatar, ninguém ganha
- Vence quem tem mais pontos

**Por que funciona bem:**
- ✅ Votação simultânea (delay não importa)
- ✅ Social e divertido
- ✅ Rápido de jogar
- ✅ Fácil de implementar

**Complexidade:** ⭐ (Baixa)

---

### 5. **Memory Sequence / Sequência de Memória**
**Como funciona:**
- Sequência de cores/números aparece
- Jogadores precisam repetir na ordem
- Sequência aumenta a cada rodada
- Quem errar primeiro perde
- Último jogador ganha

**Por que funciona bem:**
- ✅ Turnos claros
- ✅ Delay não afeta
- ✅ Testa memória
- ✅ Visual e interativo

**Complexidade:** ⭐⭐ (Média)

---

### 6. **Quick Math / Matemática Rápida**
**Como funciona:**
- Equação aparece: "5 + 3 × 2 = ?"
- Todos têm 10 segundos para responder
- Resposta correta = 1 ponto
- Mais rápido = pontos extras

**Por que funciona bem:**
- ✅ Tempo suficiente para calcular
- ✅ Delay não afeta
- ✅ Educativo
- ✅ Fácil de implementar

**Complexidade:** ⭐⭐ (Média)

---

### 7. **Category Game / Categoria**
**Como funciona:**
- Categoria aparece: "Países da Europa"
- Letra sorteada: "F"
- Jogadores escrevem uma palavra que começa com F
- Primeiro a responder corretamente ganha
- Palavras repetidas não valem

**Por que funciona bem:**
- ✅ Turnos claros
- ✅ Delay não importa
- ✅ Criativo
- ✅ Funciona em qualquer idioma

**Complexidade:** ⭐⭐⭐ (Alta - precisa validação)

---

## 🏆 Recomendação Final

### **Would You Rather** ou **Trivia Quiz**

**Por quê:**
1. **Would You Rather** - Mais simples, muito divertido, implementação rápida
2. **Trivia Quiz** - Mais educativo, ainda divertido, permite expansão fácil

**Vamos implementar:** **Would You Rather** primeiro (mais rápido), depois **Trivia Quiz** (mais completo)

---

## 📋 Próximos Passos

1. ✅ Escolher jogo
2. ⏸️ Implementar backend (lógica do jogo)
3. ⏸️ Implementar frontend (UI)
4. ⏸️ Registrar no registry
5. ⏸️ Testar com múltiplos jogadores


