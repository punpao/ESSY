# Setup Guide

## Initial Setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Copy environment file**
   ```bash
   cp .env.example .env
   ```

3. **Start infrastructure**
   ```bash
   docker compose -f infra/docker-compose.yml up -d postgres redis
   ```

4. **Generate Prisma client**
   ```bash
   cd apps/api
   pnpm db:generate
   ```

5. **Run migrations**
   ```bash
   pnpm db:migrate
   ```

6. **Seed database**
   ```bash
   pnpm db:seed
   ```

7. **Build packages**
   ```bash
   pnpm --filter @essy/core build
   pnpm --filter @essy/payment build
   pnpm --filter @essy/ui build
   ```

8. **Start development servers**
   ```bash
   pnpm dev
   ```

## Troubleshooting

### Prisma Client Not Generated
```bash
cd apps/api
pnpm db:generate
```

### Port Already in Use
Change ports in `.env` or `docker-compose.yml`:
- Frontend: 3000
- API: 3001
- Postgres: 5432
- Redis: 6379

### Database Connection Issues
```bash
# Check Postgres is running
docker ps | grep postgres

# Reset database
docker compose -f infra/docker-compose.yml down -v
docker compose -f infra/docker-compose.yml up -d postgres
cd apps/api
pnpm db:migrate
pnpm db:seed
```
