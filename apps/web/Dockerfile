# syntax=docker/dockerfile:1.4
FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
COPY packages/core/package.json packages/core/
COPY packages/payment/package.json packages/payment/
COPY packages/ui/package.json packages/ui/

RUN pnpm install

COPY . .

RUN pnpm --filter @escrow/core build \
 && pnpm --filter @escrow/payment build \
 && pnpm --filter @escrow/ui build \
 && pnpm --filter web build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "--filter", "web", "start"]
