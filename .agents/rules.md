# Diretrizes e Fluxo de Desenvolvimento - Fábrica de Software

## 1. Fluxo Obrigatório de Tarefas (Aprovação Prévia)

A IA NUNCA deve alterar ou criar arquivos sem autorização explícita do desenvolvedor. O fluxo deve ser:

1. **Consulta da Tarefa:** Recebida uma chave (ex: `VER-12`), use a ferramenta MCP do Jira para consultar título, descrição, critérios de aceite e status.
2. **Contexto Adicional:** Se a tarefa mencionar regras de negócio específicas, consulte as páginas do projeto no Notion ou a pasta `docs/`.
3. **Plano de Implementação (Proposta):** Apresente ao desenvolvedor um resumo estruturado contendo:
   - Resumo do entendimento da demanda;
   - Lista exata dos arquivos que serão criados ou editados;
   - Trechos conceituais da alteração / impacto esperado;
   - Pergunta final: _"Podemos prosseguir com essa implementação?"_
4. **Execução:** Apenas após a resposta afirmativa ("sim", "ok", "prossiga") do analista/desenvolvedor, inicie a edição dos arquivos.

## 2. Padrões de Qualidade e Boas Práticas (Anti-Alucinação)

- **Princípio da Menor Alteração:** Altere estritamente o necessário para cumprir o critério de aceite. Não refatore trechos não relacionados sem solicitação.
- **Respeito aos Tipos e Assinaturas:** Mantenha compatibilidade com os modelos e contratos de dados já existentes.
- **Tratamento de Erros:** Não ignore blocos de captura de exceção nem retorne respostas silenciosas. Toda falha de integração ou regra deve ser tratada.
- **Segurança:** Nunca grave senhas, tokens ou URLs de ambiente diretamente no código; utilize sempre variáveis de ambiente.
- **Idioma:** Respostas, comentários em código e documentações devem ser em Português (Brasil).

## 3. Padrão Git, Branches e Commits (Rastreabilidade Jira)

### Estrutura Hierárquica do Jira

- **Tarefa Pai (História / Tarefa Principal):** Representa a entrega completa do requisito.
- **Subtarefas (Sub-tasks):** Representam as etapas técnicas (ex: Desenvolvimento, Testes, Documentação).

---

### Regra de Criação de Branches (Sempre pelo ID Pai)

Toda nova branch de trabalho deve ser derivada do **ID da Tarefa Pai**, garantindo que todas as subtarefas daquela demanda convirjam para o mesmo local.

- **Comportamento da IA:** Ao receber a chave de uma subtarefa (ex: `VER-105`), consulte a issue no Jira via MCP, identifique o campo `parent` (tarefa pai, ex: `VER-100`) e oriente/crie a branch baseada no Pai.
- **Formato obrigatório:**
  `feature/VER-<ID_PAI>-<resumo-curto-do-pai>`
  ou
  `fix/VER-<ID_PAI>-<resumo-curto-do-pai>`
- **Exemplo real:**
  - Subtarefa de Dev em mãos: `VER-105`
  - Tarefa Pai vinculada: `VER-100` ("Implementar fluxo de checkout")
  - Branch resultante: `feature/VER-100-fluxo-checkout`

---

### Regra de Mensagens de Commit (Conventional Commits + ID da Subtarefa)

Cada commit deve apontar explicitamente para o ID da **Subtarefa específica** em que o analista está trabalhando no momento, seguindo rigorosamente o padrão _Conventional Commits_.

- **Formato obrigatório:**
  `<tipo>(<escopo>): [ID_SUBTAREFA] <descrição concisa da ação>`

- **Tipos aceitos:**
  - `feat`: Desenvolvimento de nova funcionalidade ou regra de negócio.
  - `fix`: Correção de bug ou ajuste de comportamento incorreto.
  - `test`: Criação, ajuste ou execução de testes automatizados/unitários.
  - `refactor`: Alteração de código interno sem mudar o comportamento da funcionalidade.
  - `docs`: Atualizações exclusivas em documentação (pasta docs, markdown).
  - `chore`: Configurações de build, dependências ou tarefas auxiliares.

- **Exemplos práticos:**
  - Se estiver executando a subtarefa de desenvolvimento (`VER-105`):
    `feat(checkout): [VER-105] cria validacao de campos de pagamento`
  - Se for refatoração dentro da subtarefa de desenvolvimento (`VER-105`):
    `refactor(checkout): [VER-105] desacopla chamada de servico de gateway`
  - Se o analista pegar a subtarefa de testes (`VER-106`):
    `test(checkout): [VER-106] adiciona suites de teste unitario para parcelamento`
  - Se for correção de bug encontrado na subtarefa de dev (`VER-105`):
    `fix(checkout): [VER-105] corrige conversao de casas decimais do valor total`

---

### Validação Obrigatória pela IA antes de Sugerir Comandos

Antes de fornecer comandos de `git checkout -b` ou `git commit`:

1. Valide se a chave informada é uma subtarefa e extraia o ID do pai correspondente para o nome da branch.
2. Formate a mensagem de commit sugerida já com o prefixo do Conventional Commits e o `[ID_SUBTAREFA]` correto entre colchetes.

### 4. Política Estrita de Controle Git (Apenas Comandos Manuais)

- **Proibição de Execução Automática:** A IA está terminantemente PROIBIDA de rodar comandos de escrita no Git (como `git commit`, `git push`, `git checkout -b`, `git merge`) por conta própria através de terminal ou ferramentas automatizadas.
- **Forma de Entrega de Ações Git:** Toda ação de versionamento deve ser fornecida ao desenvolvedor como um **bloco de comando formatado**, para que o dev revise o que foi alterado e execute manualmente no seu terminal.
- **Protocolo de Encerramento da Tarefa:** Após a aprovação e conclusão das alterações de código, a IA deve:
  1. Lembrar o dev de revisar as mudanças com `git status` e `git diff`.
  2. Fornecer o comando pronto de commit no padrão estipulado.
  3. Sugerir o comando de push se aplicável.

Exemplo de formato de saída da IA ao finalizar o código:

> "Alterações finalizadas! Por favor, revise as mudanças com `git status` e execute o commit no seu terminal:"
>
> ```bash
> git add <arquivos-alterados>
> git commit -m "feat(modulo): [VER-105] descricao concisa da alteracao"
> ```
