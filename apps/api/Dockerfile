FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8.10.0

# Set working directory
WORKDIR /app

# Copy root package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./

# Copy workspace packages
COPY packages ./packages
COPY apps/api ./apps/api

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN cd apps/api && pnpm prisma generate

# Expose port
EXPOSE 4000

# Start in dev mode by default (can override in docker-compose)
CMD ["pnpm", "--filter", "@thai-escrow/api", "dev"]
