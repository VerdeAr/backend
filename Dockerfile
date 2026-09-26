# =============================================================
# Stage 1 — Builder: instala dependências e compila TypeScript
# =============================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copia os manifestos de dependência primeiro para aproveitar o cache do Docker
COPY package*.json ./

# Instala todas as dependências (incluindo devDependencies para compilar)
RUN npm ci

# Copia o restante do código-fonte
COPY . .

# Compila o TypeScript para JavaScript (saída em ./dist)
RUN npm run build

# =============================================================
# Stage 2 — Runner: imagem enxuta apenas com o necessário
# =============================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copia apenas os manifestos para instalar dependências de produção
COPY package*.json ./

# Instala somente dependências de produção
RUN npm ci --omit=dev

# Copia os artefatos compilados do stage anterior
COPY --from=builder /app/dist ./dist

# Expõe a porta definida na variável de ambiente (padrão: 3000)
EXPOSE 3000

# Inicia o servidor
CMD ["node", "dist/server.js"]
