# Setup Guide

## Prerequisites

- Node.js 18+ 
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL client (optional, for direct DB access)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
pnpm install
```

This will:
- Install all workspace dependencies
- Generate Prisma client (via postinstall hook)

### 2. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` with your values. For local development, defaults are fine.

### 3. Start Infrastructure

```bash
docker compose -f infra/docker-compose.yml up -d postgres redis
```

Wait for services to be healthy (check with `docker compose ps`).

### 4. Database Setup

```bash
# Run migrations
pnpm db:migrate

# Seed demo data
pnpm db:seed
```

### 5. Start Development Servers

```bash
pnpm dev
```

This starts both API and Web apps via TurboRepo.

- **API**: http://localhost:3001
- **Web**: http://localhost:3000

### 6. Verify Setup

1. Visit http://localhost:3000 - should see landing page
2. Visit http://localhost:3001/health - should return `{"status":"ok"}`
3. Visit http://localhost:3001/api/v1/admin/deals - should return deals (with auth)

## Testing

### Unit Tests
```bash
pnpm test
```

### E2E Tests
```bash
# Start dev servers first
pnpm dev

# In another terminal
pnpm test:e2e
```

## Docker (Full Stack)

To run everything in Docker:

```bash
docker compose -f infra/docker-compose.yml up -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- API (port 3001)
- Web (port 3000)

## Troubleshooting

### Prisma Client Not Generated
```bash
cd apps/api
pnpm db:generate
```

### Database Connection Issues
- Check PostgreSQL is running: `docker compose ps`
- Verify DATABASE_URL in .env
- Try: `docker compose restart postgres`

### Port Already in Use
- Change ports in docker-compose.yml or .env
- Kill existing processes: `lsof -ti:3000 | xargs kill`

### Module Not Found Errors
- Run `pnpm install` again
- Check workspace links: `pnpm list --depth=0`

## Next Steps

1. **Authenticate**: Use mock LINE OAuth or email OTP (123456)
2. **Create Deal**: Go to `/seller/deal/new`
3. **Pay**: Use paylink, click "อัปสลิป" to simulate payment
4. **Ship**: Add tracking in seller dashboard
5. **Confirm**: Buyer confirms receipt
6. **Dispute**: Test dispute flow if needed

## Production Deployment

See README.md for production considerations and out-of-scope items.
