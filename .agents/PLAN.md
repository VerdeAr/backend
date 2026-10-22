# PLAN — Implementação da Tarefa VER-59

> Plano de execução subfaseado conforme exigido pelo protocolo em `.agents/AGENTS.md`.
> Regras: uma subtarefa por vez, verificação (`tsc --noEmit` e `npm run check`) antes de cada pausa, e nenhum comando de escrita no Git executado pela IA.

---

## 1. Tarefa

| Campo | Valor |
|---|---|
| Chave Jira | `VER-59` |
| Título | Implementa servidor socket.io, handshake jwt e persistencia de mensagens |
| Tipo | Subtarefa |
| Tarefa pai | `VER-58` (Mensagens e chat com WebSocket) |
| Repositório | `backend` |
| Branch | `feat/VER-59-websocket-chat` |
| Status no Jira | Fazendo |

## 2. Entendimento da demanda

Implementar a camada de comunicação em tempo real via Socket.io com autenticação JWT no handshake (via cookie HTTP-Only e header Bearer fallback), regras de negócio RN-47 e RN-48 com persistência das entidades `Chat` e `Message` via TypeORM, e disponibilizar os endpoints REST correspondentes para histórico e controle de conversas.

### Critérios de aceite

- [ ] Servidor Socket.io configurado e acoplado ao servidor HTTP do Express em `src/server.ts`.
- [ ] Middleware de handshake no Socket.io autenticando o usuário via JWT (cookies `auth_token`/`token` e fallback em `Authorization: Bearer`).
- [ ] Tratamento de eventos WebSocket: `join_chat`, `leave_chat`, `send_message`, `typing_indicator` e `message_read`.
- [ ] Persistência de mensagens no banco via TypeORM utilizando as entidades existentes `Chat` e `Message`.
- [ ] Validação das regras de negócio RN-47 (chat exclusivo entre cliente e vendedor cadastrado) e RN-48 (validação de status `ATIVO`/`FINALIZADO`).
- [ ] Endpoints REST protegidos para iniciar chat, listar conversas do usuário, obter histórico de mensagens paginado e marcar mensagens como lidas.
- [ ] Validações de entrada com Zod.
- [ ] Verificação sem erros em `tsc --noEmit` e `npm run check` (Biome).

### Contexto consultado

- Requisitos: `docs/REQUISITOS.md`
- Regras de negócio: `docs/ARQUITETURA.md` (RN-47 e RN-48)
- Arquitetura: `docs/ARQUITETURA.md` (seções de entidades `Chat`, `Message`, `User`, `Seller`)

---

## 3. Arquivos previstos

| Ação | Arquivo | Motivo |
|---|---|---|
| Editar | `package.json` | Adicionar dependência `socket.io` |
| Editar | `src/server.ts` | Criar servidor HTTP com `http.createServer(app)` e inicializar Socket.io |
| Criar | `src/websocket/socket.server.ts` | Handshake JWT, autenticação e gerenciamento de salas/eventos do Socket.io |
| Criar | `src/services/chat.service.ts` | Regras RN-47/RN-48, operações TypeORM em `Chat` e `Message` |
| Criar | `src/schemas/chat.schema.ts` | Validação Zod para criação de chat e envio de mensagens |
| Criar | `src/controllers/chat.controller.ts` | Handlers REST para endpoints de chat |
| Criar | `src/routes/chat.routes.ts` | Rotas REST de chat |
| Editar | `src/routes/index.ts` | Registrar rotas de chat na API principal |
| Editar | `docs/ANDAMENTO.md` | Atualizar status da tarefa VER-59 |
| Editar | `docs/ARQUITETURA.md` | Documentar os novos endpoints e a camada WebSocket |

---

## 4. Fases e subtarefas

### Fase 1 — WebSocket e Infraestrutura

- [x] **1.1** Instalação do `socket.io`, acoplamento do HTTP Server em `src/server.ts` e criação da infraestrutura de WebSocket com handshake JWT em `src/websocket/socket.server.ts`.
  - **Arquivos:** `package.json`, `src/server.ts`, `src/websocket/socket.server.ts`
  - **Entrega:** Servidor Socket.io inicializado, autenticando conexões com token JWT e gerenciando salas privadas de usuário.
  - **Verificação:** `tsc --noEmit` e `npm run check` sem erros.
  - **Commit sugerido:** `feat(chat): [VER-59] configura servidor socket.io e handshake jwt`

### Fase 2 — Regras de Negócio e Persistência TypeORM

- [x] **1.2** Implementação do serviço de chat (`src/services/chat.service.ts`) e conexão com eventos em tempo real (`join_chat`, `send_message`, `message_read`, `typing_indicator`).
  - **Arquivos:** `src/services/chat.service.ts`, `src/websocket/socket.server.ts`
  - **Entrega:** Regras RN-47 e RN-48 aplicadas, persistência e consulta no banco via TypeORM, emissão e recebimento de mensagens e status de leitura em tempo real.
  - **Verificação:** `tsc --noEmit` e `npm run check` sem erros.
  - **Commit sugerido:** `feat(chat): [VER-59] implementa persistencia e eventos em tempo real do chat`

### Fase 3 — Endpoints REST e Schemas Zod

- [x] **1.3** Implementação dos schemas Zod, controller e rotas HTTP de chat.
  - **Arquivos:** `src/schemas/chat.schema.ts`, `src/controllers/chat.controller.ts`, `src/routes/chat.routes.ts`, `src/routes/index.ts`
  - **Entrega:** Endpoints REST (`POST /chats`, `GET /chats`, `GET /chats/:id/messages`, `POST /chats/:id/messages`, `PATCH /chats/:id/read`, `PATCH /chats/:id/finish`) protegidos com autenticação e validação Zod.
  - **Verificação:** `tsc --noEmit` e `npm run check` sem erros.
  - **Commit sugerido:** `feat(chat): [VER-59] adiciona controller, rotas e schemas rest para chat`

### Fase final — Documentação

- [x] **F.1** Atualizar `docs/ANDAMENTO.md` e `docs/ARQUITETURA.md` refletindo a nova camada de WebSocket e endpoints de chat.
  - **Arquivos:** `docs/ANDAMENTO.md`, `docs/ARQUITETURA.md`
  - **Entrega:** Documentação sincronizada com a implementação.
  - **Commit sugerido:** `docs(chat): [VER-59] atualiza documentacao arquitetural e andamento do chat`

---

## 5. Registro de execução

| Subtarefa | Status | Verificação (`tsc` e `npm run check`) | Validada pelo desenvolvedor |
|---|---|---|---|
| 1.1 | Concluída | Passou sem erros | Em validação |
| 1.2 | Concluída | Passou sem erros | Em validação |
| 1.3 | Concluída | Passou sem erros | Em validação |
| F.1 | Concluída | Passou sem erros | Em validação |
