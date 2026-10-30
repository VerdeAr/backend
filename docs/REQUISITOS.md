# Requisitos do VerdeAr

Requisitos do produto, com o estado de cada um. O VerdeAr é um marketplace que conecta produtores familiares e orgânicos (**Vendedores**) a consumidores conscientes (**Clientes**), sem intermediários.

> Este arquivo é o mesmo nos repositórios `backend` e `frontend`. Ao alterá-lo em um, replique no outro.

- **Fontes:** Notion (*Visão Geral do Produto* e *Regras de Negócio & Glossário*), Jira (projeto `VER`) e o código do `main`.
- **Posição:** 21/10/2026.
- **Relacionados:** [ANDAMENTO.md](ANDAMENTO.md) (andamento por tarefa) e [ARQUITETURA.md](ARQUITETURA.md) (como está construído).

**Como ler**

- **Camada:** `B` = backend, `F` = frontend.
- **Estado:** **Implementado** (no `main`), **Parcial** (uma camada pronta, a outra não), **Em desenvolvimento** (tarefa em andamento no Jira) e **Planejado** (tarefa ainda a fazer).
- **Ref.:** tarefa do Jira correspondente, quando houver.

---

## 1. Perfis de usuário

| Perfil | Descrição | Definido |
|---|---|---|
| **Visitante** | Quem navega sem login. Vê a vitrine e o detalhe dos produtos. | — |
| **Cliente** | Consumidor cadastrado. Compra, acompanha pedidos e avalia. | No cadastro |
| **Vendedor** | Produtor rural ou fornecedor orgânico. Faz tudo o que o cliente faz e gerencia catálogo, frete e pedidos recebidos. | No cadastro (não muda depois) |

---

## 2. Requisitos funcionais

### 2.1 Conta e autenticação

| ID | Requisito | Camada | Estado | Ref. |
|---|---|:-:|---|---|
| RF-01 | O usuário se cadastra como Cliente ou Vendedor informando nome, e-mail, CPF válido e senha (mínimo de 6 caracteres). | B, F | Implementado | VER-38 |
| RF-02 | O cadastro de Vendedor aceita CNPJ válido, nome da fazenda e descrição. | B, F | Implementado | VER-38 |
| RF-03 | E-mail, CPF e CNPJ não podem se repetir na plataforma. | B | Implementado | VER-38 |
| RF-04 | O usuário entra com e-mail e senha e encerra a sessão pelo logout. | B, F | Implementado | VER-38 |
| RF-05 | A sessão é mantida por cookie HTTP-Only; o token nunca fica acessível a JavaScript. | B, F | Em desenvolvimento | VER-74 |
| RF-06 | O usuário edita nome, telefone, endereço e bairro; o Vendedor também edita nome da fazenda e descrição. | B, F | Implementado | VER-38 |
| RF-07 | O usuário troca a senha informando a senha atual e confirmando a nova. | B, F | Implementado | VER-38 |
| RF-08 | O Vendedor define o valor do frete fixo (não negativo; inicia em R$ 0,00). | B, F | Implementado | VER-38 |
| RF-09 | O endereço é estruturado (CEP, logradouro, número, complemento, bairro, cidade e UF), com autopreenchimento pelo ViaCEP no cadastro, no perfil e no checkout. | B, F | Planejado | VER-62 |

### 2.2 Vitrine e catálogo

| ID | Requisito | Camada | Estado | Ref. |
|---|---|:-:|---|---|
| RF-10 | A vitrine é pública e lista apenas produtos ativos e com estoque. | B, F | Implementado | VER-39 |
| RF-11 | O visitante busca por nome ou descrição (parcial, sem diferenciar maiúsculas) e filtra por categoria. | B, F | Implementado | VER-39 |
| RF-12 | A listagem é paginada (12 por página) e aceita ordenação por nome, preço ou data. | B, F | Implementado | VER-39 |
| RF-13 | O estado de busca, categoria e página fica na URL. | F | Implementado | VER-51 |
| RF-14 | A página do produto (`/produtos/:id`) mostra galeria, preço, estoque, descrição, produtor, média e quantidade de avaliações. | B, F | Implementado (QA em curso) | VER-66 |
| RF-15 | Na página do produto o cliente escolhe a quantidade (limitada ao estoque) e adiciona à sacola; o clique no card da vitrine leva até ela. | F | Implementado (QA em curso) | VER-66 |
| RF-16 | O catálogo oferece as categorias (Hortifrúti, Laticínios, Grãos, Pães e Massas, Temperos, Bebidas, Doces, Carnes e Ovos) e as unidades de medida (kg, g, L, ml, un, dz, pct, cx). | B | Implementado | VER-37 |
| RF-17 | O visitante vê o perfil público do produtor (frontend `/vendedores/:id`, API `GET /vendedores/:id`) com a história da fazenda, práticas, localização geral, reputação, depoimentos e produtos ativos, com links a partir do card e da página do produto. | B, F | Planejado | VER-70 |

### 2.3 Gestão de produtos (Vendedor)

| ID | Requisito | Camada | Estado | Ref. |
|---|---|:-:|---|---|
| RF-20 | O Vendedor cadastra e edita produtos com nome, preço, estoque, categoria, unidade, descrição e foto por URL. | B, F | Implementado | VER-39 |
| RF-21 | O Vendedor ativa ou desativa um produto sem excluí-lo. | B, F | Implementado | VER-39 |
| RF-22 | O Vendedor só gerencia os próprios produtos. | B | Implementado | VER-39 |
| RF-23 | O estoque aceita valores decimais e nunca é negativo. | B | Implementado | VER-39 |
| RF-24 | Ao excluir um produto com histórico de vendas, ele é apenas desativado. | B | Implementado | VER-39 |
| RF-25 | A foto do produto é enviada do computador direto para o armazenamento em nuvem (Cloudflare R2), com preview e validação de formato e tamanho (máximo de 5 MB). | B, F | Planejado | VER-86 |

### 2.4 Carrinho

| ID | Requisito | Camada | Estado | Ref. |
|---|---|:-:|---|---|
| RF-30 | O carrinho é do usuário logado, fica salvo no servidor e persiste entre sessões. | B, F | Implementado | VER-40 |
| RF-31 | O cliente adiciona, altera a quantidade, remove itens e esvazia o carrinho. | B, F | Implementado | VER-40 |
| RF-32 | Produto inativo, esgotado ou quantidade acima do estoque são recusados. | B | Implementado | VER-40 |
| RF-33 | O carrinho aceita produtos de vendedores diferentes. | B | Implementado | VER-40 |
| RF-34 | O cliente escolhe **Entrega** ou **Retirada** e a forma de pagamento (Cartão, PIX, Dinheiro ou Boleto). | B, F | Implementado | VER-40 |
| RF-35 | O frete soma a taxa fixa de cada vendedor presente no carrinho, só na modalidade Entrega; em Retirada é R$ 0,00. | B, F | Implementado | VER-40 |
| RF-36 | O frete passa a ser calculado pela distância de condução (taxa base + km × preço por km), exibido no carrinho, no checkout e no simulador da página do produto, com mapa da rota. | B, F | Planejado | VER-90 |

### 2.5 Checkout e pedidos do cliente

| ID | Requisito | Camada | Estado | Ref. |
|---|---|:-:|---|---|
| RF-40 | O checkout é bloqueado com carrinho vazio e, em Entrega, exige endereço cadastrado. | B, F | Implementado | VER-41 |
| RF-41 | O checkout cria o pedido com status `ABERTA`, grava o preço unitário de cada item e baixa o estoque em uma única transação (tudo ou nada). | B | Implementado | VER-41 |
| RF-42 | Ao confirmar, o carrinho é esvaziado e o cliente vê a tela de confirmação com as instruções de pagamento. | B, F | Implementado | VER-41 |
| RF-43 | O cliente consulta o histórico de compras e o detalhe de cada uma, vendo apenas as próprias. | B, F | Implementado | VER-41 |
| RF-44 | A plataforma envia e-mail de boas-vindas ao novo usuário e e-mail de confirmação de pedido ao comprador, com resumo e instruções de entrega ou retirada. | B | Planejado | VER-82 |

### 2.6 Pedidos do vendedor

| ID | Requisito | Camada | Estado | Ref. |
|---|---|:-:|---|---|
| RF-50 | O Vendedor lista os pedidos que contêm produtos seus, com filtro por status, e vê o subtotal da sua parte. | B, F | Implementado | VER-41 |
| RF-51 | O Vendedor vê o contador de pedidos pendentes no cabeçalho. | B, F | Implementado | VER-41 |
| RF-52 | Só o Vendedor altera o status: `ABERTA → FINALIZADA` ou `ABERTA → CANCELADA`. Estados finais não mudam. | B, F | Implementado | VER-41 |
| RF-53 | Ao cancelar um pedido, o estoque dos itens é devolvido. | B | Implementado | VER-41 |
| RF-54 | O Vendedor tem página de detalhe do pedido (`/vendedor/pedidos/:id`) com linha do tempo, dados do cliente e rota de entrega. | B, F | Planejado | VER-94 |
| RF-55 | O workflow do pedido ganha as etapas Recebido, Em Preparação, A Caminho e Concluído. | B, F | Planejado | VER-94 |
| RF-56 | O Vendedor propõe ajuste de itens ou pesagem, e o cliente aprova ou recusa por um banner no histórico; não há alteração unilateral. | B, F | Planejado | VER-94 |
| RF-57 | O Vendedor recebe e-mail de novo pedido e o cliente recebe e-mail a cada atualização de status. | B | Planejado | VER-82 |

### 2.7 Avaliações

| ID | Requisito | Camada | Estado | Ref. |
|---|---|:-:|---|---|
| RF-60 | O cliente avalia uma compra com nota de 1 a 5 e comentário opcional (até 500 caracteres). | B | Implementado | VER-79 |
| RF-61 | Só compras `FINALIZADA`, feitas pelo próprio cliente, podem ser avaliadas, e apenas uma vez por compra. | B | Implementado | VER-79 |
| RF-62 | A avaliação não pode ser editada nem excluída pelo cliente. | B | Implementado | VER-79 |
| RF-63 | As avaliações de um produto ou de um vendedor são listadas publicamente. | B | Implementado | VER-79 |
| RF-64 | A média e a quantidade de avaliações aparecem na página do produto. | B, F | Implementado | VER-67, VER-68 |
| RF-65 | O cliente avalia pela interface (estrelas e modal do pedido) e a reputação aparece nos cards de produto e no perfil do produtor. | F | Planejado | VER-80 |

### 2.8 Comunicação

| ID | Requisito | Camada | Estado | Ref. |
|---|---|:-:|---|---|
| RF-70 | Cliente e Vendedor trocam mensagens em tempo real (Socket.io), em salas privadas por conversa. | B, F | Em desenvolvimento | VER-58 |
| RF-71 | A conexão do chat é autenticada pelo JWT do cookie, e quem não participa da conversa é recusado. | B | Em desenvolvimento | VER-58 |
| RF-72 | O chat mostra indicador de digitação e confirmação de leitura, e as mensagens ficam salvas no banco. | B, F | Em desenvolvimento | VER-58 |
| RF-73 | Há caixa de entrada e sala de conversa, acessíveis por `/chat`. | F | Em desenvolvimento | VER-58 |

### 2.9 Qualidade da experiência

| ID | Requisito | Camada | Estado | Ref. |
|---|---|:-:|---|---|
| RF-80 | Falhas de rota, de carregamento ou de API mostram uma tela de erro amigável, e rotas inexistentes mostram uma página 404; nunca uma tela em branco. | F | Planejado | VER-55 |
| RF-81 | Componentes comuns (paginação, confirmação, seletor de quantidade, estado vazio e abas da conta) são centralizados e reutilizados. | F | Planejado | VER-48 |
| RF-82 | Todas as páginas carregam dados por data loaders do React Router. | F | Parcial (Home, Carrinho e Produto) | VER-51 |

---

## 3. Requisitos não funcionais

| ID | Categoria | Requisito | Estado |
|---|---|---|---|
| RNF-01 | Segurança | Senhas são guardadas com hash bcrypt; nenhuma senha ou token é gravado no código, e a configuração vem de variáveis de ambiente. | Implementado |
| RNF-02 | Segurança | Rotas privadas exigem JWT válido (401 sem token) e rotas de Vendedor validam o papel (403). | Implementado |
| RNF-03 | Segurança | O JWT fica em cookie `HttpOnly` (`Secure` em produção, `SameSite`), inacessível por `document.cookie` e `localStorage`; o Axios envia com `withCredentials`. | Em desenvolvimento (VER-74) |
| RNF-04 | Segurança | O CORS libera apenas as origens configuradas em `CORS_ORIGIN`. | Implementado |
| RNF-05 | Segurança | Upload de imagens por URL assinada e temporária, sem passar o arquivo pelo servidor da API. | Planejado (VER-86) |
| RNF-06 | Integridade | Operações que mexem em estoque ou em várias tabelas são transacionais, com bloqueio de escrita no produto para evitar venda acima do estoque. | Implementado |
| RNF-07 | Integridade | Toda entrada é validada com Zod; erros de validação voltam como 400 com a lista de campos inválidos. | Implementado |
| RNF-08 | Integridade | O histórico de vendas é preservado: produtos vendidos não são apagados e o preço unitário é gravado no item. | Implementado |
| RNF-09 | Confiabilidade | Erros inesperados retornam 500 sem expor detalhes internos. | Implementado |
| RNF-10 | Usabilidade | A interface é mobile-first (a partir de 375 px), com áreas de toque de no mínimo 44 px. | Implementado |
| RNF-11 | Usabilidade | Estados de carregamento (esqueletos), vazio e erro estão presentes nas telas principais. | Parcial (VER-55, VER-48) |
| RNF-12 | Desempenho | Os dados da página são carregados em paralelo antes da exibição (data loaders), sem cascata de requisições. | Parcial (VER-51) |
| RNF-13 | Desempenho | Listagens são paginadas no servidor. | Implementado |
| RNF-14 | Manutenibilidade | TypeScript em modo `strict`, sem `any`, com Biome; `npm run check` deve passar antes do Pull Request. | Implementado |
| RNF-15 | Manutenibilidade | Camadas separadas no backend (rota, controller, service, repository) e componentes por domínio no frontend. | Implementado |
| RNF-16 | Manutenibilidade | Commits no padrão Conventional Commits com o ID da tarefa, validados por Commitlint e Husky. | Implementado |
| RNF-17 | Documentação | A API é documentada em OpenAPI/Swagger (`/docs`, `/api-docs`, `/api-docs.json`). | Parcial (faltam logout e avaliações) |
| RNF-18 | Testabilidade | Há testes automatizados do caminho feliz do fluxo principal, executados no pipeline e com instrução de execução local. | Planejado (VER-17) |
| RNF-19 | Implantação | Backend e frontend rodam em containers Docker na VPS; o backend aplica as migrations ao iniciar. | Implementado (VER-45) |
| RNF-20 | Implantação | O schema do banco evolui apenas por migrations versionadas. | Implementado |
| RNF-21 | Observabilidade | Cada requisição HTTP é registrada com método, URL, status e duração. | Implementado |
| RNF-22 | Idioma | Interface, mensagens de erro, comentários e documentação em português do Brasil. | Implementado |
| RNF-23 | Custo | Serviços externos devem caber nas cotas gratuitas: Resend (3.000 e-mails/mês), Cloudflare R2 (10 GB), ViaCEP, OpenRouteService e OpenStreetMap. | Planejado |

---

## 4. Regras de negócio

As regras completas (RN-01 a RN-53) e o glossário estão no Notion, na página *Regras de Negócio & Glossário*. Em resumo, o sistema segue estas regras:

- **Usuário:** CPF e e-mail únicos; o perfil (Cliente ou Vendedor) não muda após o cadastro; o Vendedor também compra e avalia como Cliente.
- **Produto:** nome, preço, unidade e estoque são obrigatórios; estoque nunca é negativo; produto inativo não aparece na vitrine nem entra no carrinho; o preço é gravado no momento da compra.
- **Frete:** só existe na modalidade Entrega; o valor é registrado no pedido e não muda depois.
- **Pedido:** nasce `ABERTA`; só o Vendedor leva a `FINALIZADA` ou `CANCELADA`; esses estados são finais; o Vendedor vê só os pedidos com produtos seus.
- **Avaliação:** só em pedido `FINALIZADA`, uma por pedido, nota de 1 a 5, comentário opcional, sem edição.
- **Acesso:** funções de Vendedor são bloqueadas para Clientes; cada usuário vê apenas os próprios dados e pedidos.

### Divergências entre o Notion e o sistema

O Notion descreve parte do comportamento do monolito legado. Onde o sistema atual difere, vale o sistema, e o Notion deve ser atualizado.

| Regra no Notion | O que o sistema faz hoje |
|---|---|
| RN-06: o usuário atualiza nome **e e-mail**. | Edita nome, telefone, endereço e bairro; **o e-mail não pode ser alterado**. |
| RN-18: exclusão lógica de produto (soft delete). | O produto é removido; se houver vendas, é apenas desativado (RF-24). |
| RN-21: o carrinho é perdido ao encerrar a sessão. | O carrinho é **persistente** no servidor (RF-30). |
| RN-31, RN-32, RN-33 e RN-41: cliente e vendedor podem excluir pedidos em aberto. | Não há exclusão de pedidos. O Vendedor **cancela** (`CANCELADA`), e o estoque volta. |
| Visão geral: o cliente cancela pedidos em aberto. | Só o Vendedor altera o status. |
| RN-49: todas as páginas, exceto Login e Cadastro, exigem login. | A vitrine e a página do produto são **públicas**. |
| RN-43 a RN-45: frete fixo único por vendedor. | Vale por vendedor e é somado por vendedor no carrinho. Será substituído pelo cálculo por distância (RF-36). |
| RN-47 e RN-48: chat entre Cliente e Vendedor. | Em desenvolvimento (RF-70 a RF-73). |

---

## 5. Restrições e premissas

- **Pilha:** Node.js, TypeScript, Express 5, PostgreSQL e TypeORM no backend; React 19, Vite e Tailwind v4 no frontend.
- **Hospedagem:** VPS com Docker. Frontend e API devem ficar no mesmo site, porque o cookie de sessão é `SameSite`.
- **Integrações previstas:** Resend, Cloudflare R2, ViaCEP, OpenRouteService e OpenStreetMap com Leaflet, todos em planos gratuitos.
- **Escopo atual de bairros:** o seed traz bairros de Cornélio Procópio (PR); o endereço estruturado (RF-09) generaliza isso.
- **Decisão da equipe sobre pagamento:** por ser um projeto acadêmico, a plataforma não processa nem valida transações financeiras. O pagamento é combinado diretamente com o produtor, e o sistema apenas registra a forma escolhida (Cartão, PIX, Dinheiro ou Boleto).
- **Convenção de rotas públicas:** recursos públicos usam o plural (`/vendedores/:id`, `/produtos/:id`); o singular `/vendedor/...` é reservado às rotas autenticadas do próprio vendedor.
- **Fora de escopo hoje:** pagamento online, refresh token e revogação de sessão.
