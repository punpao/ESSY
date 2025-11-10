# Setup Guide - SafePay Thailand

Quick reference for getting the MVP running.

## Prerequisites Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] pnpm 8+ installed (`pnpm --version`)
- [ ] Docker installed (`docker --version`)
- [ ] Docker Compose installed (`docker compose version`)

## Method 1: Docker (Fastest)

Perfect for testing the full stack without local setup.

```bash
# 1. Clone and navigate
git clone <repo-url>
cd thai-escrow-platform

# 2. Environment (defaults work fine)
cp .env.example .env

# 3. Start everything
docker compose up -d

# 4. Wait for services to be healthy (check with)
docker compose ps

# 5. Run migrations + seed
docker exec -it escrow-api sh -c "cd /app/apps/api && npx prisma migrate deploy"
docker exec -it escrow-api sh -c "cd /app/apps/api && npx prisma db seed"

# 6. Test it
open http://localhost:3000
```

## Method 2: Local Dev (Recommended for Development)

Best for active development with hot reload.

```bash
# 1. Install dependencies
pnpm install

# 2. Start just DB & Redis via Docker
docker compose up -d postgres redis

# 3. Environment
cp .env.development .env

# 4. Database setup
pnpm db:migrate
pnpm db:seed

# 5. Start all apps in dev mode
pnpm dev

# 6. Open browser
# Frontend: http://localhost:3000
# API: http://localhost:4000/health
```

## Verify Installation

### Check API
```bash
curl http://localhost:4000/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Check Frontend
Open http://localhost:3000 - should see landing page

### Check Database
```bash
pnpm db:studio
# Opens Prisma Studio at http://localhost:5555
```

### Run Tests
```bash
pnpm test
# Should run unit tests and pass
```

## Demo Flow

1. **Login**: Go to http://localhost:3000/auth/login
   - Email: `seller@example.com`
   - OTP: Any 6 digits (e.g., `123456`)

2. **Create Deal** (as seller):
   - Navigate to dashboard
   - Click "Create Paylink"
   - Fill form → Get paylink URL

3. **Pay** (as buyer):
   - Open paylink in new incognito window
   - Click "Show QR Code"
   - Click "Mock Payment" button
   - See success message

4. **Ship** (as seller):
   - Back to seller dashboard
   - Add tracking number
   - Status → SHIPPED

5. **Confirm** (as buyer):
   - Back to buyer view
   - Click "Confirm Received"
   - Status → RELEASED
   - Money released to seller!

## Common Issues

### Port already in use
```bash
# Check what's using ports 3000, 4000, 5432, 6379
lsof -i :3000
lsof -i :4000

# Kill if needed
kill -9 <PID>
```

### Docker build fails
```bash
# Clean everything and restart
docker compose down -v
docker system prune -a
docker compose up -d --build
```

### Database connection error
```bash
# Check Postgres is running
docker compose ps postgres

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

### pnpm install fails
```bash
# Clear cache and retry
pnpm store prune
rm -rf node_modules
pnpm install
```

## Next Steps

- Read full README.md for architecture details
- Check API docs at `/api/v1/*` endpoints
- Explore Prisma schema: `apps/api/prisma/schema.prisma`
- Modify state machine: `packages/core/src/state/escrowMachine.ts`

## Production Deployment Checklist

Before going live:

- [ ] Change all secrets in .env
- [ ] Set up real PSP (Omise/GB PrimePay)
- [ ] Enable SSL/HTTPS
- [ ] Set up email service (SendGrid)
- [ ] Configure monitoring (Sentry)
- [ ] Set up backups for Postgres
- [ ] Enable rate limiting
- [ ] Review security checklist in README
- [ ] Load test with k6 or Artillery

## Support

Issues? Check:
1. Docker logs: `docker compose logs -f`
2. API logs: `docker compose logs api`
3. Next.js logs: `docker compose logs web`
4. GitHub issues

---

**Happy coding! 🚀**
