# API Dockerfile
FROM node:18-alpine AS base
RUN npm install -g pnpm@8.12.1
WORKDIR /app

# Dependencies
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/core/package.json ./packages/core/
COPY packages/payment/package.json ./packages/payment/
RUN pnpm install --frozen-lockfile

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/core/node_modules ./packages/core/node_modules
COPY --from=deps /app/packages/payment/node_modules ./packages/payment/node_modules
COPY . .
RUN pnpm --filter @escrow/core build
RUN pnpm --filter @escrow/payment build
RUN pnpm --filter @escrow/api build
RUN cd apps/api && npx prisma generate

# Production
FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/core/package.json ./packages/core/
COPY --from=builder /app/packages/payment/dist ./packages/payment/dist
COPY --from=builder /app/packages/payment/package.json ./packages/payment/

WORKDIR /app/apps/api
EXPOSE 4000

CMD ["node", "dist/index.js"]
