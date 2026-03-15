# ============================================================
# WritingCoach — Dockerfile
# Multi-stage: builds React client + compiles TypeScript server
# Final image: Node 20 Alpine (minimal footprint)
# ============================================================

# ---- Stage 1: Build React client ----
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

# ---- Stage 2: Build TypeScript server ----
FROM node:20-alpine AS server-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
COPY server/ ./server/
RUN npx tsc

# ---- Stage 3: Runtime image ----
FROM node:20-alpine AS runtime
WORKDIR /app

# Copy production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled server
COPY --from=server-builder /app/dist ./dist

# Copy React build
COPY --from=client-builder /app/client/dist ./client/dist

# Copy recipes (config — not compiled)
COPY recipes/ ./recipes/

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3000/api/recipes || exit 1

CMD ["node", "dist/server/index.js"]
