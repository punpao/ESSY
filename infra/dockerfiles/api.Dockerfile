FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json tsconfig.json ./
COPY .npmrc .npmrc 2>/dev/null || true
COPY packages ./packages
COPY apps/api ./apps/api
COPY infra ./infra
COPY apps/web/package.json ./apps/web/package.json

RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter api run build

FROM node:20-alpine
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

COPY --from=base /app /app

EXPOSE 4000
CMD ["pnpm", "--filter", "api", "start"]
