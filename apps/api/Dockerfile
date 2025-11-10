FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8.10.0

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY turbo.json ./

# Copy packages
COPY packages/core ./packages/core
COPY packages/payment ./packages/payment

# Copy app
COPY apps/api ./apps/api

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build
RUN pnpm --filter @essy/core build
RUN pnpm --filter @essy/payment build
RUN pnpm --filter @essy/api build

# Production
FROM node:18-alpine AS production

WORKDIR /app

RUN npm install -g pnpm@8.10.0

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./
COPY --from=base /app/pnpm-workspace.yaml ./
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/api/dist ./apps/api/dist
COPY --from=base /app/apps/api/package.json ./apps/api/package.json
COPY --from=base /app/apps/api/prisma ./apps/api/prisma

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["node", "dist/index.js"]
