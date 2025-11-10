# Setup Guide

## Prerequisites

- Node.js 18+ 
- pnpm 8+
- Docker & Docker Compose (for database)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Infrastructure Services

```bash
# Start PostgreSQL and Redis
docker compose -f infra/docker-compose.yml up -d postgres redis

# Wait for services to be healthy (about 10 seconds)
```

### 3. Setup Database

```bash
# Generate Prisma client
cd apps/api
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed demo data
pnpm db:seed
```

### 4. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env if needed (defaults should work for local dev)
```

### 5. Start Development Servers

```bash
# From root directory
pnpm dev

# This will start:
# - API server on http://localhost:3001
# - Web server on http://localhost:3000
```

### 6. Verify Setup

1. **API Health Check**: http://localhost:3001/health
2. **Web Landing**: http://localhost:3000
3. **Prisma Studio** (optional): `pnpm db:studio`

## Demo Users

After seeding, you can use these demo accounts:

- **Buyer**: `buyer@example.com` (any OTP works in mock mode)
- **Seller**: `seller@example.com` (verified seller)
- **Admin**: `admin@example.com`

## Testing

```bash
# Unit tests
pnpm test

# E2E tests (requires dev servers running)
pnpm test:e2e
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
docker compose -f infra/docker-compose.yml logs postgres
```

### Port Already in Use

Change ports in `.env`:
- `PORT=3001` for API
- Next.js default is 3000 for web

### Prisma Migration Issues

```bash
# Reset database (WARNING: deletes all data)
cd apps/api
pnpm prisma migrate reset

# Then re-seed
pnpm db:seed
```

## Production Build

```bash
# Build all packages
pnpm build

# Start production servers
pnpm --filter @essy/api start
pnpm --filter @essy/web start
```

## Docker Full Stack

```bash
# Build and start all services
docker compose -f infra/docker-compose.yml up -d

# View logs
docker compose -f infra/docker-compose.yml logs -f

# Stop all services
docker compose -f infra/docker-compose.yml down
```
