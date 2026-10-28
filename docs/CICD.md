# CI/CD do Backend — VerdeAr

Como o código do backend é validado, publicado e monitorado. O processo não depende de uma plataforma de hospedagem específica: o resultado do pipeline é uma **imagem Docker** no GitHub Container Registry (GHCR), que pode rodar em qualquer servidor.

## 1. Visão geral

```
Pull Request ──▶ ci.yml ──▶ merge na main ──▶ deploy.yml ──▶ homologação
                                prod ───────────────────────▶ produção
                                                    monitoring.yml (a cada 15 min)
```

| Workflow | Quando roda | O que faz |
|---|---|---|
| [`ci.yml`](../.github/workflows/ci.yml) | Em todo Pull Request para `main` ou `prod`, manualmente e quando chamado pelo deploy | **Qualidade** (`npm run check` e `npm run build`), **Testes** (integração com PostgreSQL) e **Commits** (commitlint do PR) |
| [`deploy.yml`](../.github/workflows/deploy.yml) | Push na `main` (homologação) ou na `prod` (produção) e manualmente | Roda o CI, publica a imagem no GHCR, implanta no ambiente e confere `/ready` |
| [`monitoring.yml`](../.github/workflows/monitoring.yml) | A cada 15 minutos e manualmente | Consulta `/ready` de homologação e produção com `curl --fail` |

O `ci.yml` não roda em `push`: quem o executa depois do merge é o `deploy.yml`. Assim a publicação só acontece com o CI verde e não há execução duplicada.

## 2. Ambientes

| Ambiente | Branch | Tag da imagem | GitHub Environment |
|---|---|---|---|
| Homologação | `main` | `homologacao` | `homologacao` |
| Produção | `prod` | `producao` e `latest` | `producao` |

Toda publicação também recebe a tag `sha-<commit curto>`, que identifica exatamente o código da imagem (usada no rollback). A imagem fica em `ghcr.io/verdear/backend`.

O fluxo de branches segue o [GitLab Flow](GITFLOW.md): as features entram na `main` por Pull Request e a `main` é promovida para a `prod`. No dia a dia, os desenvolvedores usam o `.env` local apontando para o banco de homologação.

Para publicar manualmente em um ambiente, use *Actions → Deploy → Run workflow* e escolha o ambiente.

## 3. Configuração no GitHub

### 3.1 Environments

Em *Settings → Environments*, crie `homologacao` e `producao`. Em `producao`, vale ativar **Required reviewers**, para a implantação esperar uma aprovação manual.

Cadastre em **cada** environment:

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `API_BASE_URL` | Variable | Sim, para verificar e monitorar | URL pública da API, sem barra no final (ex.: `https://api.exemplo.com`) |
| `DEPLOY_METHOD` | Variable | Para implantar | `webhook` ou `ssh`. Vazio: o workflow só publica a imagem |
| `DEPLOY_WEBHOOK_URL` | Secret | Método `webhook` | URL completa do webhook de deploy (cada aplicação e ambiente tem a sua) |
| `DEPLOY_WEBHOOK_TOKEN` | Secret | Opcional | Token enviado como `Authorization: Bearer` (no Coolify, o token de API com permissão *Deploy*) |
| `DEPLOY_WEBHOOK_METHOD` | Variable | Opcional | Método HTTP do webhook (padrão `POST`; o Coolify usa `GET`) |
| `DEPLOY_VERIFY_DELAY` | Variable | Opcional | Segundos de espera antes de verificar `/ready` depois do deploy (padrão `30`) |
| `DEPLOY_SSH_HOST` | Secret | Método `ssh` | Servidor de destino |
| `DEPLOY_SSH_USER` | Secret | Método `ssh` | Usuário SSH |
| `DEPLOY_SSH_KEY` | Secret | Método `ssh` | Chave privada do usuário |
| `DEPLOY_SSH_PORT` | Secret | Opcional | Porta SSH (padrão `22`) |
| `DEPLOY_SSH_PATH` | Variable | Método `ssh` | Pasta do `docker-compose.yml` no servidor |
| `DEPLOY_SSH_COMMAND` | Variable | Opcional | Comando executado no servidor (padrão `docker compose pull && docker compose up -d`) |

Se `API_BASE_URL` ou `DEPLOY_METHOD` não estiverem definidos, os workflows emitem um aviso e pulam a etapa correspondente, sem falhar.

> **Atenção ao tipo:** as colunas *Variable* e *Secret* da tabela são diferentes no GitHub. Variáveis ficam em *Environment variables* e secrets em *Environment secrets*. Os workflows leem `API_BASE_URL`, `DEPLOY_METHOD` e as demais variáveis pelo contexto `vars`, então **um valor cadastrado como secret não é enxergado** (o run apenas avisa que a variável não está definida).

### 3.2 Proteção de branch

Para o CI **bloquear o merge**, em *Settings → Branches* crie regras para `main` e `prod` exigindo os checks **Qualidade** e **Testes** (e **Commits**, se quiser) e a revisão dos code owners (`CODEOWNERS`).

### 3.3 Acesso à imagem (GHCR)

Os pacotes do GHCR são privados por padrão. Quem for baixar a imagem (a hospedagem ou um servidor) precisa de credenciais com a permissão `read:packages`, ou o pacote deve ser tornado público em *Packages → Package settings*.

## 4. Métodos de implantação

### 4.1 Webhook (`DEPLOY_METHOD=webhook`)

O workflow chama a URL configurada depois de publicar a imagem. Serve a qualquer plataforma que aceite um webhook de deploy.

**Exemplo com Coolify** (modo imagem: o GitHub Actions constrói e publica a imagem, e o Coolify só baixa e inicia):

1. **Habilite a API:** em *Settings → Advanced*, ative **API access**.
2. **Crie um token:** em *Keys & Tokens → API tokens*, crie um token com a permissão **Deploy** (ex.: descrição `ci-deploy`). O valor aparece uma única vez e vai para o secret `DEPLOY_WEBHOOK_TOKEN`.
3. **Deixe o servidor baixar do GHCR:** o Coolify precisa estar logado no `ghcr.io` para baixar imagens privadas (token do GitHub com `read:packages`). Se a tela de registries do servidor não oferecer o login, faça-o uma vez na própria VPS com `docker login ghcr.io`, e as credenciais ficam salvas para o Docker do servidor. Alternativa: tornar o pacote público em *Packages → Package settings*, o que expõe o conteúdo da imagem.
4. **Crie a aplicação como Docker Image.** "Docker Image" é um *tipo de recurso*, escolhido na criação: uma aplicação que já foi criada a partir do Git (Dockerfile, Nixpacks, Compose...) **não** pode ser convertida. Em *Projects → ambiente → New Resource → Docker Based → Docker Image*, informe:

   | Aplicação | Imagem | Tag | Porta exposta |
   |---|---|---|---|
   | Backend, homologação | `ghcr.io/verdear/backend` | `homologacao` | `3000` |
   | Backend, produção | `ghcr.io/verdear/backend` | `producao` | `3000` |

   A imagem precisa **já existir no GHCR** (rode o `deploy.yml` antes, com um merge na `main` ou manualmente). Depois copie para a aplicação nova as variáveis de ambiente (`DB_*`, `JWT_SECRET`, `CORS_ORIGIN`, `PORT`...) e o domínio da aplicação antiga.
5. **Deploy automático desligado** (*manual deployments only*): a implantação deve ocorrer só pelo webhook, depois do CI verde.
6. **Copie o webhook de cada aplicação** para o secret `DEPLOY_WEBHOOK_URL` do environment correspondente. O formato é `GET https://<seu-coolify>/api/v1/deploy?uuid=<uuid-da-aplicacao>&force=false`, então defina `DEPLOY_WEBHOOK_METHOD=GET` e `DEPLOY_METHOD=webhook`.
7. **Health check:** ative o health check da aplicação com o caminho `/health` (a própria imagem também declara um `HEALTHCHECK`).

O mesmo token de API serve para todas as aplicações; só a URL (com o `uuid`) muda por aplicação e ambiente.

> **Limite da verificação:** o webhook do Coolify apenas enfileira o deploy e responde na hora, e a versão antiga continua respondendo `/ready` até a nova ficar saudável. Por isso a etapa *Verificar* espera `DEPLOY_VERIFY_DELAY` segundos antes de consultar e serve como confirmação de que a API está de pé, não como prova de que a versão nova já entrou. O acompanhamento do deploy em si está nos logs do Coolify, e o `monitoring.yml` detecta quedas depois.

As variáveis de ambiente da aplicação (`DB_*`, `JWT_SECRET`, `CORS_ORIGIN` etc.) ficam configuradas na própria plataforma, nunca no repositório.

#### Migrando uma aplicação existente (build pelo Git) para Docker Image

Faça uma aplicação de cada vez, começando por uma de homologação:

1. Publique a imagem (`deploy.yml`) e confirme que a tag existe no GHCR.
2. Crie a aplicação nova (passo 4 acima) com um **domínio temporário** e as mesmas variáveis de ambiente da antiga.
3. Dispare o deploy da aplicação nova e confira `/health` e `/ready` nesse domínio.
4. Troque o domínio definitivo: remova-o da aplicação antiga e coloque na nova, e reimplante a nova.
5. Atualize o secret `DEPLOY_WEBHOOK_URL` do environment com o webhook da aplicação nova (o `uuid` é outro).
6. Desligue a aplicação antiga por alguns dias, para ter volta rápida, e depois apague-a.

### 4.2 SSH (`DEPLOY_METHOD=ssh`)

O workflow entra no servidor, vai até `DEPLOY_SSH_PATH` e executa `docker compose pull && docker compose up -d`. O servidor precisa ter o Docker e um `docker-compose.yml` que use a imagem (exemplo na seção 5).

## 5. Rodar a imagem em qualquer lugar

```bash
docker run -d --name verdear-backend -p 3000:3000 --env-file .env \
  ghcr.io/verdear/backend:producao
```

Ou, com Docker Compose (`docker-compose.yml`):

```yaml
services:
  backend:
    image: ghcr.io/verdear/backend:producao
    restart: unless-stopped
    env_file: .env
    ports:
      - "3000:3000"
```

Variáveis do `.env`: `PORT` (padrão 3000), `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`, `JWT_SECRET` e `CORS_ORIGIN`. O banco de dados é externo à imagem. As migrations rodam sozinhas na inicialização, e o seed (`npm run seed`) é manual, uma vez por ambiente novo.

A imagem declara um `HEALTHCHECK` em `/health`, e `docker ps` mostra `healthy` quando a API está de pé.

## 6. Endpoints de verificação

| Rota | Uso | Resposta |
|---|---|---|
| `GET /health` | Processo no ar (healthcheck do contêiner). Não consulta o banco | `200` |
| `GET /ready` | API pronta para tráfego: confere o banco com `SELECT 1`. Usada pelo deploy e pelo monitoramento | `200` ou `503` sem banco |

## 7. Rollback

Cada publicação gera a tag `sha-<commit curto>`. Para voltar a uma versão anterior:

- **Webhook/plataforma:** troque a tag da aplicação para `sha-<commit>` (ex.: `ghcr.io/verdear/backend:sha-1a2b3c4`) e reimplante.
- **SSH/Compose:** ajuste a tag no `docker-compose.yml` do servidor e rode `docker compose up -d`.
- **Definitivo:** faça um `revert` do commit problemático pelo fluxo normal de Pull Request.

## 8. Monitoramento

O `monitoring.yml` roda a cada 15 minutos e faz `curl --fail` em `${API_BASE_URL}/ready` de cada ambiente, com até 3 tentativas. Se um ambiente não responde ou o banco cai (`503`), a execução falha e o GitHub notifica os responsáveis pelo repositório. Para rodar na hora: *Actions → Monitoramento → Run workflow*.

Workflows agendados só rodam na branch padrão (`main`).

## 9. Rodando localmente

Os testes de integração e o passo a passo do banco de testes estão no [README](../README.md#testes). Para validar a imagem localmente:

```bash
docker build -t verdear-backend:local .
docker run -d --name vd --env-file .env -p 3000:3000 verdear-backend:local
curl http://localhost:3000/ready
```

## 10. Problemas comuns

| Sintoma | Causa provável |
|---|---|
| `Qualidade` falha com `Merge conflict marker` | Um merge foi commitado com conflito não resolvido |
| `Testes` falham no CI mas passam local | O CI usa um PostgreSQL novo; confira migrations e variáveis `DB_*` |
| `Publicar imagem` falha ao enviar | O repositório precisa da permissão de escrita em pacotes (`packages: write` já está no workflow) |
| `Implantar` avisa que `DEPLOY_METHOD` não está definido | O environment ainda não foi configurado; a imagem foi publicada, mas nada foi implantado |
| `Implantar` avisa que `DEPLOY_METHOD` não está definido, mas ele foi cadastrado | Foi criado como *secret* em vez de *variable* no environment |
| Coolify falha com `error from registry: denied` | A VPS não está autenticada no `ghcr.io`: rode `docker login ghcr.io` na VPS com um token clássico `read:packages` (autorizado para a organização, se houver SSO) e reimplante |
| `Verificar` falha após o deploy | A API não respondeu em `/ready`: veja os logs da aplicação e as variáveis `DB_*` |
