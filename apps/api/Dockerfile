FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g turbo

# ─── Dependencies ─────────────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/database/package*.json ./packages/database/
RUN npm ci --workspace=apps/api --workspace=packages/database

# ─── Development ──────────────────────────────────────────────────
FROM deps AS development
COPY . .
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
EXPOSE 3000
CMD ["npm", "run", "dev", "--workspace=apps/api"]

# ─── Build ────────────────────────────────────────────────────────
FROM deps AS build
COPY . .
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
RUN npm run build --workspace=apps/api

# ─── Production ───────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=build --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/apps/api/package.json ./package.json

USER nestjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:3000/api/v1/health || exit 1
CMD ["node", "dist/main"]
