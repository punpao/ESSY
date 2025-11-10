FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/web/package.json ./apps/web/
COPY packages/core/package.json ./packages/core/
COPY packages/ui/package.json ./packages/ui/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY apps/web ./apps/web
COPY packages ./packages

# Expose port
EXPOSE 3000

# Start command
CMD ["pnpm", "--filter", "@thai-escrow/web", "dev"]
