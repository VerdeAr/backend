# Andamento do Projeto — Backend

Retrato do que já foi entregue, do que está em andamento e do que está planejado para a API do VerdeAr.

- **Fonte:** projeto `VER` no Jira, cruzado com o `main` do repositório.
- **Posição:** 04/11/2026.
- **Atualização:** manual. Ao concluir uma tarefa, mova a linha de seção e ajuste `ARQUITETURA.md` e `README.md` (ver `.agents/AGENTS.md`).

Legenda dos status do Jira: **Feito**, **Revisão** (code review), **Fazendo**, **A fazer**.

---

## 1. Resumo

| Épico | Status | Observação |
|---|---|---|
| VER-46 — Validações Iniciais | Feito | Levantamento de fluxos e validação das funcionalidades básicas. |
| VER-36 — Migração | Feito | Backend migrado do monolito para API REST independente. |
| VER-47 — Funcionalidades Finais e Qualidade | A fazer no Jira | 14 tarefas: 1 concluída (VER-17), 4 em andamento (VER-58, VER-62, VER-74 e VER-78) e 9 por iniciar. Destas, VER-51, VER-66 e VER-90 já têm subtarefas entregues ou em andamento. Há também o bug VER-108 aberto. |

---

## 2. Implementado

### Migração do monolito (VER-36, épico concluído)

| Tarefa | Entrega |
|---|---|
| VER-37 | Modelagem TypeORM de todas as entidades, migrations, seeds e interceptores. |
| VER-38 | Login JWT, registro (Cliente e Vendedor), perfil e configuração de frete. |
| VER-39 | Home pública, categorias, busca e CRUD de produtos pelo produtor rural. |
| VER-40 | Carrinho persistente, cálculo de frete e seleção de pagamento. |
| VER-41 | Venda transacional ACID, baixa de estoque e painel de pedidos. |
| VER-44 | Auditoria de type safety, testes integrados, Swagger e arquivamento do legado. |
| VER-45 | Dockerfile e deploy dos servidores de backend e frontend. |

### Já mergeadas no `main` (épico VER-47)

| Subtarefa | Entrega | Tarefa |
|---|---|---|
| VER-67 | `GET /produtos/:id` enriquecido com métricas de avaliação | VER-66 — Páginas de detalhe do produto (PDP) |
| VER-75 | `cookie-parser`, cookie `Set-Cookie` seguro e rota de logout | VER-74 — Cookies HTTP-Only |
| VER-79 | Regras de negócio e endpoints do módulo de avaliações (`/avaliacoes`) | VER-78 — Avaliação pós-venda |
| VER-59 | Servidor Socket.io, handshake com JWT, persistência de mensagens e endpoints REST em `/chats` | VER-58 — Mensagens e chat |

### CI/CD e testes automatizados (VER-17, concluída)

| Subtarefa | Entrega | Repositório |
|---|---|---|
| VER-98 | Endpoints `/health` e `/ready`, saída em falha de banco e `HEALTHCHECK` | Backend |
| VER-99 | Testes de integração do fluxo principal com Vitest e Supertest | Backend |
| VER-100 | Pipeline `ci.yml` e Dependabot | Backend |
| VER-101 | Swagger atualizado e rota única `/docs` | Backend |
| VER-102 | Pipelines `deploy.yml` e `monitoring.yml` e `docs/CICD.md` | Backend |
| VER-103 | Testes unitários e de componentes com Vitest e Testing Library | Frontend |
| VER-104 | Teste E2E do caminho feliz de compra com Playwright | Frontend |
| VER-105 | Workflows de CI, deploy e monitoramento, Dependabot e `docs/CICD.md` | Frontend |
| VER-106 | QA: pipelines, deploy nos dois ambientes, monitoramento e Swagger | Os dois |
| VER-107 | Documentação: README, Arquitetura, Requisitos, Andamento, `.agents` e Notion | Os dois |

Resultado: os ambientes de **homologação** e **produção** estão no ar, com deploy automático depois do CI verde e monitoramento de `/ready` a cada 15 minutos (ver [CICD.md](CICD.md)). O E2E do frontend roda contra a `main` deste repositório, então uma mudança incompatível em uma resposta da API pode quebrá-lo.

---

## 3. Em andamento

| Tarefa | Status | Backend | Frontend | QA |
|---|---|---|---|---|
| VER-58 — Mensagens e chat com WebSocket (Socket.io) | Fazendo | VER-59 Feito (no `main`) | VER-60 Feito | VER-61 **Fazendo** |
| VER-62 — Endereços com CEP e autopreenchimento | Fazendo | VER-63 A fazer | VER-64 **Revisão** | VER-65 A fazer |
| VER-74 — Blindagem de autenticação com cookies HTTP-Only | Fazendo | VER-75 Feito (no `main`) | VER-76 Feito | VER-77 **Fazendo** |
| VER-78 — Avaliação pós-venda | Fazendo | VER-79 Feito (no `main`) | VER-80 Feito | VER-81 A fazer |
| VER-90 — Frete dinâmico com OpenRouteService e Leaflet | A fazer (a tarefa; as subtarefas já começaram) | VER-91 **Fazendo** | VER-92 **Fazendo** | VER-93 A fazer |
| VER-66 — PDP | A fazer (o Jira não atualizou a tarefa) | VER-67 Feito (no `main`) | VER-68 Feito | VER-69 A fazer |
| VER-51 — Data loaders do React Router | Fazendo | VER-52 **Revisão** (suporte a aliases de query e sanitização de vazios) | VER-53 Feito | VER-54 A fazer |
| VER-94 — Painel do vendedor e workflow de pedidos | A fazer (a tarefa; o backend já começou) | VER-95 **Fazendo** (branch `feat/VER-95-detalhe-pedido-ajuste-consentimento`: detalhe, máquina de estados, histórico, ajuste com consentimento e testes) | VER-96 A fazer | VER-97 A fazer |

---

## 4. Planejado (A fazer)

Itens com trabalho de backend previsto, na ordem do Jira:

| Tarefa | Backend previsto |
|---|---|
| VER-70 — Perfil público do produtor | VER-71: endpoint público `GET /vendedores/:id`. |
| VER-82 — E-mails transacionais com Resend | VER-83: integração do SDK Resend e templates. |
| VER-86 — Imagens na Cloudflare R2 | VER-87: cliente S3 para R2 e geração de presigned URLs. |

Itens sem trabalho de backend: VER-48 (subcomponentização do frontend) e VER-55 (`errorElement` e página 404).

---

## 5. Pendências conhecidas

- **VER-108 (bug, A fazer):** os endpoints de chat expõem o hash da senha, o CPF, o e-mail e o telefone do outro participante da conversa. Precisa ser corrigido antes de o chat ser considerado concluído (VER-58).
- A entidade `CartItem` declara `UNIQUE (cart_id, product_id)`, mas a constraint não existe no banco; o `migration:generate` sempre a propõe. Corrigir em uma migration própria ainda não tem tarefa.
- O `POST /vendas/checkout` devolve a entidade crua da venda (pagamento como objeto e itens sem `product_name`), diferente do `GET /vendas/:id`. O frontend contorna isso buscando o pedido pelo ID. Ajustar para devolver a venda formatada ainda não tem tarefa.

---

## 6. Impacto previsto na arquitetura

Quando as tarefas abaixo forem entregues, revise estas partes de `ARQUITETURA.md`:

| Tarefa | O que muda na documentação |
|---|---|
| VER-90 | O **frete** deixa de ser o valor fixo por produtor e passa a depender da distância. Atualizar as seções de carrinho e checkout, e o `fixed_shipping_rate`. |
| VER-62 | O **endereço** do usuário passa a ser estruturado (CEP e campos separados). Atualizar o modelo de dados e o cadastro. |
| VER-58 | O servidor Socket.io (VER-59) já está no `main`. Depois da QA (VER-61) e da correção da VER-108, atualizar a visão de sistema, a autenticação e as limitações. |
| VER-86 | `image_url` passa a apontar para o R2, com upload por URL pré-assinada. Atualizar catálogo, variáveis de ambiente e Docker. |
| VER-82 | Novo serviço externo (Resend) e novas variáveis de ambiente. |
| VER-94 | Feito na VER-95 (máquina de estados, histórico e ajustes em `ARQUITETURA.md` §6 e §8). Revisar após a QA da VER-97. |
| VER-74 | Concluída a QA (VER-77), remover as ressalvas sobre o cookie e o token no corpo da resposta de login. |

---

## 7. Documentos relacionados

- [REQUISITOS.md](REQUISITOS.md) — o que o sistema deve fazer, com o estado de cada requisito.
- [ARQUITETURA.md](ARQUITETURA.md) — como o sistema está estruturado hoje.
- [CICD.md](CICD.md) — pipelines de CI, deploy e monitoramento.
- [GITFLOW.md](GITFLOW.md) — fluxo de branches e Pull Requests.
- [README.md](../README.md) — setup e scripts.
