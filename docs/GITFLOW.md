# Diretrizes do Fluxo de Trabalho: GitLab Flow

Este documento estabelece o padrão de versionamento e integração de código da equipe, baseado na metodologia **GitLab Flow**. O objetivo deste modelo é simplificar o processo de desenvolvimento, garantindo uma fonte única de verdade e facilitando a entrega contínua.

## 1. Princípios Fundamentais

O GitLab Flow destaca-se pela sua simplicidade em comparação com modelos mais complexos (como o Git Flow), promovendo a integração contínua e a redução de conflitos. Os seus pilares no nosso ambiente são:

* **Ramo Principal (`main`):** Atua como a única fonte de verdade. Todo o código neste ramo deve ser testado, funcional e estar pronto para transitar para ambientes de homologação ou produção.
* **Ramos de Funcionalidade (`feature branches`):** Todo o novo desenvolvimento (novas funcionalidades, correções de falhas ou refatorações) deve ocorrer em ramos isolados, criados exclusivamente a partir do `main`.
* **Integração via Pull Requests:** A incorporação de código no ramo principal é estritamente realizada por Pull Requests, garantindo a revisão por pares e a execução de testes automatizados.
* **Ramos de Ambiente/Lançamento (Release Branches):** Em vez de publicar diretamente do `main`, a implantação é gerida por ramos específicos (ex: `production`, `staging`), refletindo o estado exato de cada ambiente.

---

## 2. Ciclo de Vida do Desenvolvimento (Passo a Passo)

A execução de qualquer tarefa deve seguir rigorosamente a sequência abaixo:

### Passo 2.1: Criação do Ramo de Funcionalidade
Sincronize o seu repositório local e crie um novo ramo a partir da versão mais recente do `main`. A nomenclatura deve ser descritiva e categorizada.
* **Padrão recomendado:** `tipo/identificador-descricao-curta`
* **Exemplos:** `feature/102-autenticacao-usuario`, `bugfix/105-erro-calculo-carrinho`

### Passo 2.2: Desenvolvimento e Commits Frequentes
Realize o desenvolvimento da tarefa, efetuando commits lógicos e atómicos.
* As mensagens de commit devem ser claras, no modo imperativo, e descrever com precisão a alteração realizada no código.

### Passo 2.3: Abertura do Pull Request (PR)
Assim que a funcionalidade estiver concluída ou pronta para discussão técnica, submeta um Pull Request apontando para o ramo `main`.
* Preencha o modelo de Pull Request com as informações necessárias.
* Associe o PR à Issue correspondente no sistema de rastreamento.

### Passo 2.4: Revisão de Código (Code Review) e Integração Contínua (CI)
O Pull Request será submetido à validação de dois pilares:
1.  **Testes Automatizados (CI):** O sistema executará a bateria de testes e a verificação de qualidade de código (linting). O PR não pode ser aprovado se houver falhas.
2.  **Revisão por Pares:** Pelo menos um revisor técnico deve aprovar as alterações, garantindo a conformidade com a arquitetura e os padrões do projeto.

### Passo 2.5: Integração (Merge)
Após a aprovação e o sucesso nos testes de integração contínua, o código é integrado ao ramo `main`. Recomenda-se a utilização da estratégia "Squash and Merge" para manter o histórico do ramo principal limpo e linear. O ramo de funcionalidade deve ser eliminado após a integração.

### Passo 2.6: Gestão de Ambientes e Implantação
Para promover o código para ambientes específicos (Homologação, Produção), o fluxo dita a criação ou atualização de ramos de ambiente.
* O código flui numa única direção: **sempre** do `main` para os ramos de ambiente (ex: efetuando o merge de `main` para `production`).
* Correções urgentes (hotfixes) não são feitas diretamente em produção. Elas devem seguir o fluxo normal (Feature -> `main` -> `production`) ou, em casos críticos de dessincronização, ser aplicadas no `main` e integradas (cherry-picked) no ramo de produção.

---

## 3. Boas Práticas e Regras de Ouro

* **Ramos de curta duração:** Evite manter ramos de funcionalidade ativos por longos períodos. Entregas menores (Small Batches) reduzem a complexidade e o risco de conflitos de código.
* **O `main` nunca deve ser quebrado:** A responsabilidade de manter a integridade do ramo principal é partilhada por toda a equipa.
* **Sincronização constante:** Atualize frequentemente o seu ramo local com o `main` (utilizando `git rebase` ou `git merge`) durante o desenvolvimento para resolver potenciais conflitos antecipadamente.
