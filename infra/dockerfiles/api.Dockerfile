FROM node:20-alpine AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY package.json pnpm-workspace.yaml turbo.json tsconfig.json .eslintrc.cjs .prettierrc ./ 
COPY apps ./apps
COPY packages ./packages
COPY infra ./infra

RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @thai-escrow/api build

EXPOSE 4000

CMD ["pnpm", "--filter", "@thai-escrow/api", "start"]
