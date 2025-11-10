FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8.10.0

# Set working directory
WORKDIR /app

# Copy root package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./

# Copy workspace packages
COPY packages ./packages
COPY apps/web ./apps/web

# Install dependencies
RUN pnpm install --frozen-lockfile

# Expose port
EXPOSE 3000

# Start in dev mode by default
CMD ["pnpm", "--filter", "@thai-escrow/web", "dev"]
