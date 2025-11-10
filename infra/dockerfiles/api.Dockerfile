FROM node:20-alpine AS base
WORKDIR /app

COPY ../../package.json ../../pnpm-workspace.yaml ./ 
RUN npm install -g pnpm@8.15.4

FROM base AS builder
COPY ../../apps/api ./apps/api
COPY ../../packages ./packages
COPY ../../tsconfig.base.json ./tsconfig.base.json
RUN pnpm install && pnpm --filter @escrow/api build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY ../../apps/api/package.json ./apps/api/package.json
ENV NODE_ENV=production
CMD ["node", "apps/api/dist/server.js"]
