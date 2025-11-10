# Setup Instructions

## Initial Setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```
   This will create `pnpm-lock.yaml` automatically.

2. **Setup environment variables**
   ```bash
   cp .env.example .env
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```

3. **Start PostgreSQL and Redis**
   
   Option A: Using Docker Compose (recommended)
   ```bash
   docker compose -f infra/docker-compose.yml up -d postgres redis
   ```
   
   Option B: Install locally and start services

4. **Run database migrations**
   ```bash
   pnpm db:migrate
   ```

5. **Seed demo data**
   ```bash
   pnpm db:seed
   ```

6. **Start development servers**
   ```bash
   pnpm dev
   ```

   - API: http://localhost:3001
   - Web: http://localhost:3000

## Docker Setup (Full Stack)

```bash
# Build and start all services
docker compose -f infra/docker-compose.yml up -d

# View logs
docker compose -f infra/docker-compose.yml logs -f

# Stop services
docker compose -f infra/docker-compose.yml down
```

## Testing

```bash
# Unit tests
pnpm test

# E2E tests (requires dev server running)
pnpm test:e2e
```

## Troubleshooting

### Prisma Client not generated
```bash
cd apps/api && pnpm prisma:generate
```

### Port already in use
Change ports in `.env` files or stop conflicting services.

### Database connection errors
Ensure PostgreSQL is running and `DATABASE_URL` is correct in `.env`.
