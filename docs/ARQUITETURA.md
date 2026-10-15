# Arquitetura do Backend — Verdear

Este repositório (`VerdeAr/backend`) contém a API RESTful que substitui integralmente a camada de backend do monolito legado [`VerdeAr/Verdear`](https://github.com/VerdeAr/Verdear), consolidando a separação completa entre frontend e backend do ecossistema Verdear.

O frontend consumidor desta API é o repositório irmão [`VerdeAr/frontend`](https://github.com/VerdeAr/frontend).

---

## 1. Status da Migração do Monólito

A migração do domínio de negócio do monólito legado foi **concluída com sucesso**:
- **Autenticação e Perfis:** Substituição da modelagem antiga por `User` e perfil estendido `Seller` (produtor rural) com senhas em bcrypt e tokens JWT.
- **Catálogo de Produtos:** `Product`, `Category` e `MeasurementUnit` desacoplados, oferecendo busca pública paginada e painel CRUD restrito ao vendedor com controle de estoque e status ativo/inativo.
- **Carrinho e Frete:** Carrinho persistente no banco de dados (`Cart`, `CartItem`) com cálculo dinâmico de frete por bairro (`Neighborhood`) e taxa fixa parametrizada pelo produtor (`fixed_shipping_rate`).
- **Checkout Transacional (ACID):** `Sale`, `SaleProduct`, `Payment` executados sob transação com garantia estrita de integridade, decremento de estoque e estorno automático em cancelamento.
- **Documentação de API:** Especificação OpenAPI 3.0 / Swagger cobrindo 100% dos endpoints ativos em `/docs`, `/api-docs` e `/api-docs.json`.

---

## 2. Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Runtime / Gerenciador | Node.js + npm |
| Linguagem | TypeScript (Strict Mode) |
| Framework HTTP | Express 5 |
| Banco de dados | PostgreSQL |
| ORM | TypeORM |
| Autenticação | JWT + bcrypt |
| Validação de Entrada | Zod (com DTOs estritamente inferidos) |
| Documentação de API | Swagger UI (`swagger-ui-express` + OpenAPI 3.0) |
| Qualidade de Código | Biome (linter e formatação estrita) |
| Git hooks | Husky + Commitlint (Conventional Commits) |
| Containerização | Docker (multi-stage build com Node Alpine) |
| Configuração | dotenv (`.env`) |

---

## 3. Estrutura de Pastas

```
src/
├── config/            # Conexão com PostgreSQL (TypeORM), Swagger e CORS
├── controllers/       # Recepção de requisições, delegação para services e resposta HTTP
├── entities/          # Entidades TypeORM mapeadas para as tabelas do PostgreSQL
├── errors/            # Classes de erro customizadas (AppError)
├── middlewares/       # JWT Auth, Role Guards, validação Zod e errorHandler central
├── migrations/        # Migrations versionadas do TypeORM
├── repositories/      # Camada de acesso a dados e queries especializadas
├── routes/            # Definição e agrupamento de rotas HTTP
├── schemas/           # Schemas Zod de validação e DTOs tipados (z.infer)
├── seeds/             # População inicial de dados do sistema
├── services/          # Regras de negócio, cálculos e transações ACID
└── types/             # Extensões de tipo globais (ex: express.d.ts)
```

**Fluxo de uma Requisição:**
`Route` → `Middleware (Auth / Zod)` → `Controller` → `Service (Regra de Negócio / ACID)` → `Repository` → `Entities (PostgreSQL)`.

---

## 4. Diretrizes Arquiteturais

1. **Separação Estrita de Responsabilidades:**
   - **Controllers:** Não contêm regras de negócio nem queries diretas ao banco.
   - **Services:** Concentram regras e lógica de negócio. Operações transacionais utilizam `DataSource.transaction` para garantir atomicidade ACID.
   - **Repositories:** Ponto único de comunicação com o banco e TypeORM.
2. **Type Safety Absoluto:**
   - Uso de `any` é terminantemente vetado.
   - DTOs de entrada e saída são inferidos diretamente dos schemas Zod (`z.infer<typeof schema>`).
3. **Tratamento de Erros:**
   - Erros de validação Zod retornam HTTP 400 com a lista detalhada de campos inválidos.
   - Erros de negócio disparam `AppError` com status HTTP semântico (400, 401, 403, 404, 409).
   - O middleware `errorHandler` captura exceções não tratadas retornando HTTP 500 sem expor stack traces.

---

## 5. Setup Local e Execução

### Pré-requisitos
- Node.js (v20+)
- PostgreSQL rodando localmente ou via container Docker

### Passos de Instalação:
1. Copie as variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Execute as migrations e seeds:
   ```bash
   npm run migration:run
   npm run seed
   ```
4. Inicie o servidor em modo de desenvolvimento:
   ```bash
   npm run dev
   ```
5. Acesse a documentação interativa:
   - Swagger UI: `http://localhost:3000/docs` ou `http://localhost:3000/api-docs`
   - OpenAPI JSON: `http://localhost:3000/api-docs.json`
