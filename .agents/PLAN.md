# PLAN — Modelo de Planejamento de Tarefa

> Modelo do plano de execução exigido pelo protocolo em `.agents/AGENTS.md`.
> Para cada nova tarefa, preencha este arquivo (ou copie a estrutura) **antes** de alterar qualquer código e só avance após a validação do desenvolvedor.
> Regras do plano: uma subtarefa por vez, verificação (`tsc --noEmit` e `npm run check`) antes de cada pausa, e nenhum comando de escrita no Git executado pela IA.

---

## 1. Tarefa

| Campo | Valor |
|---|---|
| Chave Jira | `VER-<ID>` |
| Título | _título da issue_ |
| Tipo | Tarefa, História ou Subtarefa |
| Tarefa pai | `VER-<ID_PAI>` (apenas informativo; a branch usa o ID da própria tarefa) |
| Repositório | `backend` |
| Branch | `<tipo>/VER-<ID>-<descricao-curta-em-portugues>` |
| Status no Jira | _A fazer, Fazendo, Revisão ou Feito_ |

## 2. Entendimento da demanda

_Resumo objetivo, em poucas linhas, do que a tarefa pede e do problema que resolve._

### Critérios de aceite (copiados do Jira)

- [ ] _critério 1_
- [ ] _critério 2_
- [ ] _critério 3_

### Contexto consultado

- Requisitos: `docs/REQUISITOS.md` (IDs RF/RNF relacionados: _RF-xx_)
- Regras de negócio: Notion, *Regras de Negócio & Glossário* (_RN-xx_)
- Arquitetura: `docs/ARQUITETURA.md` (seções relevantes: _x_)

### Premissas, riscos e dúvidas em aberto

- _premissa ou dúvida que precisa de resposta do desenvolvedor_

---

## 3. Arquivos previstos

| Ação | Arquivo | Motivo |
|---|---|---|
| Criar | `src/...` | _por quê_ |
| Editar | `src/...` | _por quê_ |
| Editar | `docs/ARQUITETURA.md`, `README.md` | _documentação em dia, quando houver mudança de comportamento_ |

---

## 4. Fases e subtarefas

Legenda: `[ ]` a fazer, `[~]` em execução, `[x]` concluída e validada pelo desenvolvedor.

### Fase 1 — _nome da fase_

- [ ] **1.1** _subtarefa atômica_
  - **Arquivos:** `src/...`
  - **Entrega:** _resultado verificável_
  - **Verificação:** `tsc --noEmit` e `npm run check` sem erros
  - **Commit sugerido:** `feat(escopo): [VER-<ID>] descricao curta no imperativo`
- [ ] **1.2** _subtarefa atômica_
  - **Arquivos:** `src/...`
  - **Entrega:** _resultado verificável_
  - **Verificação:** `tsc --noEmit` e `npm run check` sem erros
  - **Commit sugerido:** `feat(escopo): [VER-<ID>] descricao curta no imperativo`

### Fase 2 — _nome da fase_

- [ ] **2.1** _subtarefa atômica_
  - **Arquivos:** `src/...`
  - **Entrega:** _resultado verificável_
  - **Verificação:** `tsc --noEmit` e `npm run check` sem erros
  - **Commit sugerido:** `test(escopo): [VER-<ID>] descricao curta no imperativo`

### Fase final — Documentação

- [ ] **F.1** Atualizar `README.md`, `docs/ARQUITETURA.md`, `docs/REQUISITOS.md` e `docs/ANDAMENTO.md`
  - **Commit sugerido:** `docs(escopo): [VER-<ID>] atualiza documentacao da tarefa`

> Cada mensagem de commit: português, imperativo, no máximo 100 caracteres no total (tipo, escopo, ID e descrição).

---

## 5. Registro de execução

Preencha ao fim de cada subtarefa, antes de pedir a validação.

| Subtarefa | Status | Verificação (`tsc` e `npm run check`) | Validada pelo desenvolvedor |
|---|---|---|---|
| 1.1 | A fazer | — | — |
| 1.2 | A fazer | — | — |
| 2.1 | A fazer | — | — |

### Pergunta de validação (modelo)

> Subtarefa [X.Y] finalizada e verificada. Podemos validar essa etapa e prosseguir para a próxima subtarefa?

### Bloco de comandos Git (entregue ao desenvolvedor, nunca executado pela IA)

```bash
git checkout -b <tipo>/VER-<ID>-<descricao-curta-em-portugues>
git add <arquivos-alterados>
git commit -m "feat(escopo): [VER-<ID>] descricao curta no imperativo"
git push -u origin <tipo>/VER-<ID>-<descricao-curta-em-portugues>
```

---

## 6. Encerramento da tarefa

- [ ] Todos os critérios de aceite atendidos
- [ ] `tsc --noEmit` e `npm run check` sem erros
- [ ] Documentação atualizada
- [ ] Commits revisados com `git status` e `git diff`
- [ ] Pull Request aberto e subtarefa movida no Jira para **Revisão**
