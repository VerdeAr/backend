# Arquitetura do Backend — Verdear

Este repositório (`VerdeAr/backend`) contém a API que substitui a camada de backend do monolito legado [`VerdeAr/Verdear`](https://github.com/VerdeAr/Verdear), como parte da separação entre frontend e backend do projeto. O monolito segue **ativo em paralelo** até que a migração seja concluída e validada — não descontinue funcionalidades lá sem confirmar que já existem aqui.

O frontend consumidor desta API é o repositório irmão [`VerdeAr/frontend`](https://github.com/VerdeAr/frontend).

---

## 1. Stack

| Camada | Tecnologia |
|---|---|
| Runtime / gerenciador de pacotes | Node.js + npm |
| Linguagem | TypeScript |
| Framework HTTP | Express |
| Banco de dados | PostgreSQL |
| ORM | TypeORM |
| Autenticação | JWT + bcrypt (hash de senha) |
| Validação de dados | Zod |
| Documentação de API | Swagger |
| Qualidade de código | Biome (lint/format) |
| Git hooks | Husky |
| Padrão de commits | Commitlint (Conventional Commits) |
| Containerização | Docker |
| Variáveis de ambiente | dotenv |

---

## 2. Estrutura de pastas

```
src/
├── routes/            # Mapeamento de endpoints HTTP para controllers
├── controllers/       # Recebem request/response; validam entrada (dto + Zod) e delegam para services
├── services/          # Regras de negócio; orquestram repositories
├── repositories/      # Acesso a dados via TypeORM
├── entities/          # Entidades TypeORM (tabelas do banco)
├── middlewares/       # Autenticação (JWT), tratamento de erros, etc.
├── migrations/        # Migrations do TypeORM
└── types/
    └── dto/            # Contratos de entrada/saída (Data Transfer Objects)
```

Fluxo de uma requisição: `routes` → `controllers` (valida entrada com `dto`/Zod) → `services` (regra de negócio) → `repositories` (acesso a dados via `entities`).

**Responsabilidade de cada camada:**
- **Controller:** não deve conter regra de negócio nem query direta ao banco — apenas validação de entrada, chamada ao service correspondente e formatação da resposta HTTP.
- **Service:** concentra a regra de negócio. É a camada testável isoladamente, sem depender do Express.
- **Repository:** único lugar que fala diretamente com o TypeORM/banco.

---

## 3. Migração do domínio de negócio a partir do monolito

O schema de dados do monolito (`Verdear/prisma/schema.prisma`) possui 13 tabelas, mas apenas 7 têm uso comprovado em regras de negócio no código atual do monolito. Ao portar para `entities/` TypeORM:

**Migrar primeiro (uso confirmado no monolito):** `Pessoa`, `Categoria`, `UnidadeMedida`, `Produto`, `Venda`, `VendaProduto`, `Avaliacao`.

**Não migrar sem confirmação prévia** (presentes no schema do monolito, porém sem nenhum controller/rota utilizando-as no código atual — candidatas a código morto): `bairro`, `chat`, `frete`, `pagamento`, `formapagamento`, `vendedor`. Antes de recriá-las aqui, confirmar com o time se são funcionalidades planejadas (chat comprador-vendedor, frete por bairro, múltiplas formas de pagamento, perfil estendido de vendedor) ou se devem ser descartadas na migração.

> **Regra de negócio pendente de decisão:** no monolito, o frete no checkout é um valor fixo (R$ 15,00 para entregas) que ignora o campo `pessoa.frete_fixo` configurável pelo vendedor via `PUT /pessoa/frete`. Definir a regra correta junto ao time antes de implementar o módulo de checkout/frete aqui.

---

## 4. Convenções

- **Commits:** Conventional Commits, validados via Commitlint no hook `commit-msg` (Husky).
- **Lint/format:** Biome, recomendado em hook de pre-commit (Husky).
- **Fluxo de branches:** GitLab Flow — ver [`docs/GITFLOW.md`](./GITFLOW.md).
- **Idioma:** Código, comentários e documentação em Português (Brasil).

---

## 5. Setup local

Ainda não há `Dockerfile`, `docker-compose.yml` nem `.env.example` neste repositório. Esta seção deve ser preenchida assim que a configuração de containerização e as variáveis de ambiente forem definidas.
