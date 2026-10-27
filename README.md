# VerdeAr — Backend

> Do campo à sua mesa — produtos orgânicos e da agricultura familiar, com quem produz de verdade.

API RESTful do **VerdeAr**, um marketplace que conecta produtores familiares e orgânicos diretamente a consumidores conscientes. Este repositório substitui a camada de backend do monolito legado [`VerdeAr/Verdear`](https://github.com/VerdeAr/Verdear). O frontend consumidor é o repositório [`VerdeAr/frontend`](https://github.com/VerdeAr/frontend).

## Funcionalidades

- **Autenticação e perfis:** cadastro de Cliente ou Vendedor (produtor rural), senhas com bcrypt e sessão via JWT.
- **Catálogo:** produtos, categorias e unidades de medida; busca pública paginada e CRUD restrito ao vendedor, com controle de estoque e status ativo/inativo (exclusão lógica).
- **Carrinho persistente:** salvo no banco, com frete fixo configurado por cada vendedor e somado por produtor na modalidade Entrega.
- **Checkout transacional (ACID):** venda, itens e pagamento em uma transação, com decremento de estoque e estorno no cancelamento.
- **Pedidos do vendedor:** cada vendedor vê e gerencia apenas os pedidos que contêm seus produtos.
- **Avaliações:** nota de 1 a 5 e comentário opcional, apenas para pedidos finalizados.
- **Documentação OpenAPI/Swagger** de todos os endpoints.

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 22 + npm |
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

## Pré-requisitos

- Node.js 20+ (a imagem Docker usa 22)
- PostgreSQL rodando localmente ou em container

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

O `entrypoint.sh` executa as migrations automaticamente antes de iniciar o servidor. O `DB_HOST` precisa ser alcançável de dentro do container.

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
| `/vendedor/pedidos` | Pedidos do vendedor | Vendedor |
| `/carrinho` | Carrinho persistente | Logado |
| `/vendas` | Checkout e histórico de compras | Logado (alterar status: Vendedor) |
| `/avaliacoes` | Avaliações de pedidos | Logado |

Rotas autenticadas esperam `Authorization: Bearer <token>`.

## Regras de negócio principais

As regras completas (RN-01 a RN-53) estão no Notion, na página *Regras de Negócio & Glossário*. Resumo:

- CPF e e-mail são únicos; o perfil (Cliente ou Vendedor) não muda após o cadastro.
- Apenas vendedores gerenciam produtos, frete fixo e pedidos, e somente os próprios.
- Estoque nunca é negativo; produtos inativos não aparecem na vitrine nem entram no carrinho.
- O preço é gravado no momento da compra; frete só é cobrado na modalidade **Entrega** (em **Retirada** é R$ 0,00).
- Pedidos nascem como `ABERTA` e só o vendedor os leva a `FINALIZADA` ou `CANCELADA` (estados terminais).
- Só pedidos finalizados podem ser avaliados, uma vez, com nota de 1 a 5.

## Fluxo de contribuição

- **Branches:** GitLab Flow. Crie `<tipo>/VER-<ID>-<descricao-curta-em-portugues>` a partir de `main` (ex.: `feat/VER-105-validacao-pagamento`), usando o ID da própria tarefa; o código flui de `main` para os ramos de ambiente (ex.: `prod`). Ver [docs/GITFLOW.md](docs/GITFLOW.md).
- **Commits:** Conventional Commits com o ID da subtarefa do Jira, validados pelo Commitlint:
  ```
  feat(modulo): [VER-105] descricao concisa da alteracao
  ```
  Redigidos em português, no imperativo, com no máximo 100 caracteres. Prefixos: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`.
- **Pull Request:** revisado por pares (responsáveis no `CODEOWNERS`) e com `npm run check` passando.
- **Segurança:** nunca comite tokens, senhas ou URLs fixas; use o `.env`.
- **Definition of Done:** critérios de aceite do Jira atendidos, commits no padrão, sem credenciais expostas, testes validados pelo QA com evidências, subtarefas concluídas e PR aprovado.

## Documentação adicional

- [docs/ARQUITETURA.md](docs/ARQUITETURA.md) — arquitetura, modelo de dados, regras implementadas e limitações conhecidas
- [docs/REQUISITOS.md](docs/REQUISITOS.md) — requisitos funcionais e não funcionais, com o estado de cada um
- [docs/ANDAMENTO.md](docs/ANDAMENTO.md) — o que já foi entregue, o que está em andamento e o que está planejado
- [docs/GITFLOW.md](docs/GITFLOW.md) — fluxo de versionamento
