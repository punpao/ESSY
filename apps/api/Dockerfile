FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm@8.15.4
COPY package.json pnpm-workspace.yaml turbo.json tsconfig.json vitest.config.ts ./
COPY apps ./apps
COPY packages ./packages
COPY infra ./infra
COPY .env.example ./
RUN pnpm install
RUN pnpm --filter api prisma generate --schema infra/prisma/schema.prisma
RUN pnpm --filter api build
CMD ["pnpm", "--filter", "api", "start"]
