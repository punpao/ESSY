FROM node:18-alpine AS base

RUN npm install -g pnpm@8.10.0

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY turbo.json ./

COPY packages/core ./packages/core
COPY packages/payment ./packages/payment
COPY packages/ui ./packages/ui

COPY apps/web ./apps/web

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @essy/core build
RUN pnpm --filter @essy/payment build
RUN pnpm --filter @essy/ui build
RUN pnpm --filter @essy/web build

FROM node:18-alpine AS production

WORKDIR /app

RUN npm install -g pnpm@8.10.0

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./
COPY --from=base /app/pnpm-workspace.yaml ./
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/web/.next ./apps/web/.next
COPY --from=base /app/apps/web/public ./apps/web/public
COPY --from=base /app/apps/web/package.json ./apps/web/package.json
COPY --from=base /app/apps/web/next.config.js ./apps/web/next.config.js

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["node", "node_modules/next/dist/bin/next", "start"]
