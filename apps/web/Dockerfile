FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm@8.15.4
COPY package.json pnpm-workspace.yaml turbo.json tsconfig.json vitest.config.ts ./
COPY apps ./apps
COPY packages ./packages
COPY infra ./infra
RUN pnpm install
RUN pnpm --filter web build
EXPOSE 3000
CMD ["pnpm", "--filter", "web", "start"]
