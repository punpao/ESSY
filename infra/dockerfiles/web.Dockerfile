FROM node:20-alpine AS base
WORKDIR /app

COPY ../../package.json ../../pnpm-workspace.yaml ./ 
RUN npm install -g pnpm@8.15.4

FROM base AS builder
COPY ../../apps/web ./apps/web
COPY ../../packages ./packages
COPY ../../tsconfig.base.json ./tsconfig.base.json
RUN pnpm install && pnpm --filter @escrow/web build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY ../../apps/web/package.json ./apps/web/package.json
COPY ../../apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["pnpm", "--dir", "apps/web", "start"]
