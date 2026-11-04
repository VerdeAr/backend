# VerdeAr — Backend

> Do campo à sua mesa — produtos orgânicos e da agricultura familiar, com quem produz de verdade.

API RESTful do **VerdeAr**, um marketplace que conecta produtores familiares e orgânicos diretamente a consumidores conscientes. Este repositório substitui a camada de backend do monolito legado [`VerdeAr/Verdear`](https://github.com/VerdeAr/Verdear). O frontend consumidor é o repositório [`VerdeAr/frontend`](https://github.com/VerdeAr/frontend).

## Funcionalidades

- **Autenticação e perfis:** cadastro de Cliente ou Vendedor (produtor rural), senhas com bcrypt e sessão via JWT.
- **Catálogo:** produtos, categorias e unidades de medida; busca pública paginada e CRUD restrito ao vendedor, com controle de estoque e status ativo/inativo (exclusão lógica).
- **Carrinho persistente:** salvo no banco, com frete fixo configurado por cada vendedor e somado por produtor na modalidade Entrega.
- **Checkout transacional (ACID):** venda, itens e pagamento em uma transação, com decremento de estoque e estorno no cancelamento.
- **Pedidos do vendedor:** cada vendedor vê e gerencia apenas os pedidos que contêm seus produtos, com página de detalhe, linha do tempo de status e o fluxo Recebido → Em Preparação → A Caminho → Concluído.
- **Ajuste com consentimento:** o vendedor propõe ajuste de quantidade ou pesagem e o cliente aceita ou recusa; não há alteração unilateral.
- **Avaliações:** nota de 1 a 5 e comentário opcional, apenas para pedidos finalizados.
- **Documentação OpenAPI/Swagger** de todos os endpoints.

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 26 + npm |
| Linguagem | TypeScript (strict) |
| Framework HTTP | Express 5 |
| Banco de dados | PostgreSQL |
| ORM | TypeORM (migrations versionadas) |
| Autenticação | JWT + bcrypt (cookie-parser) |
| Validação | Zod (DTOs inferidos com `z.infer`) |
| Documentação | swagger-ui-express (OpenAPI 3.0) |
| Qualidade | Biome |
| Testes | Vitest + Supertest, com PostgreSQL de testes em contêiner |
| Git hooks | Husky + Commitlint (Conventional Commits) |
| Container | Docker multi-stage (Node Alpine) |
| CI/CD | GitHub Actions, imagem no GHCR e Dependabot |

## Pré-requisitos

- Node.js 22 ou superior (o CI e a imagem Docker usam o Node 26)
- PostgreSQL rodando localmente ou em container

## Ambientes

| Ambiente | Branch | API | Documentação (Swagger) | Saúde |
|---|---|---|---|---|
| **Homologação** | `main` | https://api-verdear-dev.pedmesa.com.br | [/docs](https://api-verdear-dev.pedmesa.com.br/docs) | [/ready](https://api-verdear-dev.pedmesa.com.br/ready) |
| **Produção** | `prod` | https://api-verdear.pedmesa.com.br | [/docs](https://api-verdear.pedmesa.com.br/docs) | [/ready](https://api-verdear.pedmesa.com.br/ready) |

O GitHub também lista os ambientes em **Deployments**, na lateral da página do repositório, com o endereço e a data do último deploy. Como o pipeline publica e implanta cada ambiente, veja [docs/CICD.md](docs/CICD.md).

## Como executar

```bash
# 1. Variáveis de ambiente
cp .env.example .env

# 2. Dependências
npm install

# 3. Migrations e dados iniciais
npm run migration:run
npm run seed

# 4. Servidor em modo desenvolvimento (http://localhost:3000)
npm run dev
```

Documentação interativa:

- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs.json`

### Variáveis de ambiente

| Variável | Descrição | Padrão do `.env.example` |
|---|---|---|
| `PORT` | Porta da API | `3000` |
| `DB_HOST` | Host do PostgreSQL | `localhost` |
| `DB_PORT` | Porta do PostgreSQL | `5432` |
| `DB_USER` | Usuário do banco | `postgres` |
| `DB_PASS` | Senha do banco | `postgres` |
| `DB_NAME` | Nome do banco | `verdear` |
| `JWT_SECRET` | Segredo de assinatura dos tokens | `default_secret` |
| `CORS_ORIGIN` | Origens permitidas, separadas por vírgula | `http://localhost:5173` |

> Nunca comite o `.env`. Troque `JWT_SECRET` em qualquer ambiente que não seja local.

### Seed

`npm run seed` insere (de forma idempotente) os dados essenciais:

- **Categorias:** Hortifrúti, Laticínios, Grãos, Pães e Massas, Temperos, Bebidas, Doces, Carnes e Ovos
- **Unidades de medida:** kg, g, L, ml, un, dz, pct, cx
- **Formas de pagamento:** Cartão, PIX, Dinheiro, Boleto
- **Bairros:** Centro, Jardim Progresso, Vila Nova, Jardim Primavera, Vila Santa Terezinha e Zona Rural (Cornélio Procópio)

## Scripts

| Script | Descrição |
|---|---|
| `npm run dev` | Servidor com hot reload (`tsx watch`) |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Executa a build (`node dist/server.js`) |
| `npm run check` | Type check (código e testes) + Biome com `--error-on-warnings` |
| `npm test` | Executa os testes de integração (exige o banco de testes) |
| `npm run test:watch` | Testes em modo observação |
| `npm run lint` | Biome |
| `npm run migration:generate` | Gera migration a partir das entidades |
| `npm run migration:run` | Aplica migrations pendentes |
| `npm run migration:revert` | Reverte a última migration |
| `npm run migration:run:prod` | Aplica migrations sobre `dist/` |
| `npm run seed` | Popula dados essenciais |

## Testes

Os testes são de integração: sobem a API (sem `listen`) e fazem requisições reais com Supertest contra um PostgreSQL de testes. Cobrem o caminho feliz do fluxo principal (cadastro, login, produto, carrinho, checkout, finalização e avaliação), erros importantes (carrinho vazio, estoque, permissões, avaliação duplicada, cancelamento), os endpoints de saúde e a consistência do Swagger com as rotas.

### Pré-requisito

Apenas o **Docker**. O PostgreSQL de testes roda em um contêiner (`docker-compose.test.yml`), então **não é preciso instalar o PostgreSQL** na máquina.

### Passo a passo

```bash
# 1. Variáveis dos testes (arquivo não versionado)
cp .env.test.example .env.test

# 2. Banco de testes descartável (porta 5433, dados em memória)
docker compose -f docker-compose.test.yml up -d --wait

# 3. Testes
npm test

# 4. Ao terminar (opcional)
docker compose -f docker-compose.test.yml down
```

### Como funciona

- Antes da suíte, as migrations e o seed rodam automaticamente no banco de testes.
- **Trava de segurança:** os testes só executam se `DB_NAME` terminar em `_test`. Isso impede rodar por engano contra o banco de homologação ou de produção.
- Cada teste cria usuários e produtos com dados únicos (CPF, CNPJ e e-mail gerados), então a suíte pode rodar várias vezes seguidas sem limpar o banco.
- Os arquivos rodam em sequência, porque compartilham o mesmo banco.
- No CI, as variáveis `DB_*` e `JWT_SECRET` vêm do ambiente do workflow e o `.env.test` não é necessário.

## Docker

```bash
docker build -t verdear-backend .
docker run -p 3000:3000 --env-file .env verdear-backend
```

O `entrypoint.sh` executa as migrations automaticamente antes de iniciar o servidor. O `DB_HOST` precisa ser alcançável de dentro do container. A imagem tem um `HEALTHCHECK` que consulta `/ready`.

## CI/CD

Os workflows ficam em `.github/workflows/`:

| Workflow | O que faz |
|---|---|
| `ci.yml` | Em todo Pull Request para `main` ou `prod`: **Qualidade** (`npm run check` e `npm run build`), **Testes** (integração com PostgreSQL) e **Commits** (Commitlint do PR) |
| `deploy.yml` | Push na `main` (homologação) ou na `prod` (produção): roda o CI, publica a imagem no GHCR, implanta (`webhook` ou `ssh`) e confere `/ready` |
| `monitoring.yml` | A cada 15 minutos, consulta `/ready` de cada ambiente |

O Dependabot abre PRs de atualização de npm, GitHub Actions e Docker. A configuração dos Environments, as variáveis, o rollback e os problemas comuns estão em [docs/CICD.md](docs/CICD.md).

## Estrutura do projeto

```
src/
├── config/         # Conexão TypeORM, Swagger e CORS
├── controllers/    # Recebem a requisição, delegam aos services e respondem
├── entities/       # Entidades TypeORM (tabelas PostgreSQL)
├── errors/         # AppError e erros customizados
├── middlewares/    # Auth JWT, guards de papel, validação Zod, logging, errorHandler
├── migrations/     # Migrations do TypeORM
├── repositories/   # Acesso a dados e queries especializadas
├── routes/         # Definição das rotas HTTP
├── schemas/        # Schemas Zod e DTOs
├── seeds/          # Dados iniciais
├── services/       # Regras de negócio e transações
└── types/          # Extensões de tipos globais
```

Fluxo de uma requisição: `Route → Middleware (Auth/Zod) → Controller → Service → Repository → Entities`.

### Diretrizes

- Controllers não têm regra de negócio nem acessam o banco; services concentram as regras; repositories são o único ponto de acesso ao TypeORM.
- Operações que alteram várias tabelas usam `DataSource.transaction`.
- `any` é proibido; tipos de entrada/saída vêm dos schemas Zod.
- Erros de validação retornam 400 com os campos inválidos; erros de negócio usam `AppError` (400, 401, 403, 404, 409); erros inesperados retornam 500 sem stack trace.

## Endpoints (prefixos)

Detalhes de parâmetros e respostas estão no Swagger.

| Prefixo | Recurso | Acesso |
|---|---|---|
| `/auth` | Login, registro e sessão (`/auth/me` exige token) | Público / Logado |
| `/pessoa` | Dados do usuário, senha e frete fixo | Logado (frete: Vendedor) |
| `/bairros` | Bairros | Público |
| `/produtos` | Vitrine: listagem e detalhe | Público |
| `/categorias` | Categorias | Público |
| `/unidades-medida` | Unidades de medida | Público |
| `/vendedor/produtos` | Catálogo do vendedor (CRUD) | Vendedor |
| `/vendedor/pedidos` | Pedidos do vendedor: lista, detalhe, mudança de status e proposta de ajuste | Vendedor |
| `/carrinho` | Carrinho persistente | Logado |
| `/vendas` | Checkout, histórico de compras e resposta ao ajuste | Logado (alterar status: Vendedor) |
| `/avaliacoes` | Avaliações de pedidos | Logado |
| `/chats` | Conversas e mensagens (o tempo real usa Socket.io) | Logado |
| `/health` | Liveness: confirma que o processo responde, sem consultar o banco | Público |
| `/ready` | Readiness: confere o banco (200 com banco no ar, 503 sem banco) | Público |

Rotas autenticadas leem o token do cookie `token` (HTTP-Only); o cabeçalho `Authorization: Bearer <token>` continua aceito para clientes de API.

## Regras de negócio principais

As regras completas (RN-01 a RN-53) estão no Notion, na página *Regras de Negócio & Glossário*. Resumo:

- CPF e e-mail são únicos; o perfil (Cliente ou Vendedor) não muda após o cadastro.
- Apenas vendedores gerenciam produtos, frete fixo e pedidos, e somente os próprios.
- Estoque nunca é negativo; produtos inativos não aparecem na vitrine nem entram no carrinho.
- O preço é gravado no momento da compra; frete só é cobrado na modalidade **Entrega** (em **Retirada** é R$ 0,00).
- Pedidos nascem como `ABERTA` e só o vendedor os avança: `EM_PREPARACAO`, `A_CAMINHO` (só na Entrega) e `FINALIZADA`, ou `CANCELADA`. `FINALIZADA` e `CANCELADA` são terminais, e cancelar devolve o estoque.
- O vendedor pode propor ajuste de quantidade ou pesagem em pedidos `ABERTA` ou `EM_PREPARACAO`. O pedido fica `AGUARDANDO_APROVACAO_CLIENTE` até o cliente responder: aceitar aplica os novos valores e volta ao status anterior; recusar cancela o pedido.
- Só pedidos finalizados podem ser avaliados, uma vez, com nota de 1 a 5.

## Fluxo de contribuição

- **Branches:** GitLab Flow. Crie `<tipo>/VER-<ID>-<descricao-curta-em-portugues>` a partir de `main` (ex.: `feat/VER-105-validacao-pagamento`), usando o ID da própria tarefa; o código flui de `main` para os ramos de ambiente (ex.: `prod`). Ver [docs/GITFLOW.md](docs/GITFLOW.md).
- **Commits:** Conventional Commits com o ID da subtarefa do Jira, validados pelo Commitlint:
  ```
  feat(modulo): [VER-105] descricao concisa da alteracao
  ```
  Redigidos em português, no imperativo, com no máximo 100 caracteres. Prefixos: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`.
- **Pull Request:** revisado por pares (responsáveis no `CODEOWNERS`) e com o CI verde (Qualidade, Testes e Commits). Rode `npm run check` e `npm test` localmente antes de abrir o PR.
- **Segurança:** nunca comite tokens, senhas ou URLs fixas; use o `.env`.
- **Definition of Done:** critérios de aceite do Jira atendidos, commits no padrão, sem credenciais expostas, testes validados pelo QA com evidências, subtarefas concluídas e PR aprovado.

## Documentação adicional

- [docs/ARQUITETURA.md](docs/ARQUITETURA.md) — arquitetura, modelo de dados, regras implementadas e limitações conhecidas
- [docs/REQUISITOS.md](docs/REQUISITOS.md) — requisitos funcionais e não funcionais, com o estado de cada um
- [docs/ANDAMENTO.md](docs/ANDAMENTO.md) — o que já foi entregue, o que está em andamento e o que está planejado
- [docs/GITFLOW.md](docs/GITFLOW.md) — fluxo de versionamento
- [docs/CICD.md](docs/CICD.md) — pipelines de CI, deploy e monitoramento, e como configurar o GitHub
