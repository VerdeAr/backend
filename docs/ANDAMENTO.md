# Andamento do Projeto — Backend

Retrato do que já foi entregue, do que está em andamento e do que está planejado para a API do VerdeAr.

- **Fonte:** projeto `VER` no Jira, cruzado com o `main` do repositório.
- **Posição:** 21/10/2026.
- **Atualização:** manual. Ao concluir uma tarefa, mova a linha de seção e ajuste `ARQUITETURA.md` e `README.md` (ver `.agents/AGENTS.md`).

Legenda dos status do Jira: **Feito**, **Revisão** (code review), **Fazendo**, **A fazer**.

---

## 1. Resumo

| Épico | Status | Observação |
|---|---|---|
| VER-46 — Validações Iniciais | Feito | Levantamento de fluxos e validação das funcionalidades básicas. |
| VER-36 — Migração | Feito | Backend migrado do monolito para API REST independente. |
| VER-47 — Funcionalidades Finais e Qualidade | Em andamento | 2 tarefas em andamento, 1 concluída e 11 por iniciar. |

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

---

## 3. Em andamento

| Tarefa | Status | Backend | Frontend | QA |
|---|---|---|---|---|
| VER-74 — Blindagem de autenticação com cookies HTTP-Only | Fazendo | VER-75 Feito | VER-76 Revisão | VER-77 A fazer |
| VER-58 — Mensagens e chat com WebSocket (Socket.io) | Fazendo | VER-59 **Feito** (servidor Socket.io, handshake JWT e persistência de mensagens) | VER-60 A fazer | VER-61 A fazer |
| VER-66 — PDP | Feito | VER-67 Feito | VER-68 Feito | VER-69 **Fazendo** (QA ainda em curso) |

---

## 4. Planejado (A fazer)

Itens com trabalho de backend previsto, na ordem do Jira:

| Tarefa | Backend previsto |
|---|---|
| VER-78 — Avaliação pós-venda | Backend concluído (VER-79). Faltam o frontend (VER-80) e o QA (VER-81). |
| VER-51 — Data loaders do React Router | VER-52: ajustes de endpoints para suportar loaders paralelos. |
| VER-62 — Endereços com CEP | VER-63: migration TypeORM e schemas de endereço estruturado. |
| VER-70 — Perfil público do produtor | VER-71: endpoint público `GET /vendedores/:id`. |
| VER-82 — E-mails transacionais com Resend | VER-83: integração do SDK Resend e templates. |
| VER-86 — Imagens na Cloudflare R2 | VER-87: cliente S3 para R2 e geração de presigned URLs. |
| VER-90 — Frete dinâmico com OpenRouteService e Leaflet | VER-91: integração com OpenRouteService e preço por quilômetro. |
| VER-94 — Painel do vendedor e workflow de pedidos | VER-95: detalhe de pedido e workflow de ajustes com consentimento do cliente. |
| VER-17 — Testes do fluxo principal | Criar os testes automatizados do fluxo principal. |

Itens sem trabalho de backend: VER-48 (subcomponentização do frontend) e VER-55 (`errorElement` e página 404).

---

## 5. Impacto previsto na arquitetura

Quando as tarefas abaixo forem entregues, revise estas partes de `ARQUITETURA.md`:

| Tarefa | O que muda na documentação |
|---|---|
| VER-90 | O **frete** deixa de ser o valor fixo por produtor e passa a depender da distância. Atualizar as seções de carrinho e checkout, e o `fixed_shipping_rate`. |
| VER-62 | O **endereço** do usuário passa a ser estruturado (CEP e campos separados). Atualizar o modelo de dados e o cadastro. |
| VER-58 | Nova camada de tempo real (Socket.io, com JWT no handshake). `Chat` e `Message` deixam de ser só modelo. Atualizar visão de sistema, autenticação e limitações. |
| VER-86 | `image_url` passa a apontar para o R2, com upload por URL pré-assinada. Atualizar catálogo, variáveis de ambiente e Docker. |
| VER-82 | Novo serviço externo (Resend) e novas variáveis de ambiente. |
| VER-94 | Novo estado ou fluxo de ajuste de pedido. Atualizar a máquina de estados de `Sale`. |
| VER-74 | Concluída a QA, remover as ressalvas sobre o cookie e o token no corpo da resposta de login. |
| VER-17 e Swagger | Ao existirem testes, CI e documentação completa, remover os itens correspondentes da seção "Limitações conhecidas". |

---

## 6. Documentos relacionados

- [REQUISITOS.md](REQUISITOS.md) — o que o sistema deve fazer, com o estado de cada requisito.
- [ARQUITETURA.md](ARQUITETURA.md) — como o sistema está estruturado hoje.
- [GITFLOW.md](GITFLOW.md) — fluxo de branches e Pull Requests.
- [README.md](../README.md) — setup e scripts.
