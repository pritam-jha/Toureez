# ── Stage 1: Builder ──────────────────────────────────────────────────────────
# Installs all dependencies (including devDeps) and compiles TypeScript.
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests first so the layer is cached unless deps change.
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDeps needed for tsc).
RUN npm ci --frozen-lockfile

# Copy source and compile.
COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ── Stage 2: Runner ───────────────────────────────────────────────────────────
# Minimal image — only production deps and compiled JS.
FROM node:20-alpine AS runner

WORKDIR /app

# Run as a non-root user for defence in depth.
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 appuser

# Copy only what the running server needs.
COPY --from=builder /app/package.json    ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# Install production dependencies only.
RUN npm ci --frozen-lockfile --omit=dev

# Copy compiled output.
COPY --from=builder /app/dist ./dist

# Environment defaults — override at runtime with --env-file .env or -e
ENV NODE_ENV=production \
    PORT=3000 \
    LOG_LEVEL=info

# Switch to non-root user.
USER appuser

EXPOSE ${PORT}

# Use the compiled entry point.
CMD ["node", "dist/server.js"]
