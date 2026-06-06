FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
RUN npm ci --workspace=apps/web

FROM deps AS development
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev", "--workspace=apps/web"]

FROM deps AS build
COPY . .
RUN npm run build --workspace=apps/web

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3001
ENV PORT=3001 HOSTNAME=0.0.0.0
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:3001 || exit 1
CMD ["node", "apps/web/server.js"]
