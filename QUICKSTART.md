# Quick Start Guide

Get the Thai Escrow Platform running in **5 minutes**.

## Prerequisites Check

```bash
node --version    # Should be >= 18
pnpm --version    # Should be >= 8
docker --version  # Should be recent
```

Don't have pnpm? Install it:
```bash
npm install -g pnpm@8.10.0
```

## Fast Track: Docker (Recommended)

```bash
# 1. Install dependencies
pnpm install

# 2. Start everything with Docker
docker compose up -d

# Wait 30 seconds for services to initialize...

# 3. Run migrations & seed
docker compose exec api pnpm prisma migrate deploy
docker compose exec api pnpm prisma db seed

# 4. Done! Open your browser
```

**URLs:**
- 🌐 Frontend: http://localhost:3000
- 🚀 API: http://localhost:4000
- ❤️ Health Check: http://localhost:4000/health

## Demo Flow (After Setup)

### 1. Create Your First Paylink

1. Go to http://localhost:3000
2. Click "เริ่มขาย" (Start Selling)
3. Login with email: `seller@example.com`
   - Check API logs for OTP: `docker compose logs -f api`
   - You'll see: `OTP for seller@example.com: 123456`
4. Click "สร้าง Paylink ใหม่"
5. Fill in:
   - Title: `iPhone 13 Pro Max`
   - Amount: `25000`
6. Click "สร้าง Paylink"
7. Copy the paylink URL

### 2. Make a Payment

1. Open the paylink URL in a new incognito window
2. Click "สร้าง QR Code เพื่อชำระเงิน"
3. Click "จำลองการชำระเงินสำเร็จ" (mock payment button)
4. You should see "ชำระเงินสำเร็จ!"
5. Status changes to `HOLD` (money is escrowed)

### 3. Add Tracking

1. Go back to seller dashboard (first window)
2. Click on the deal
3. Click "เพิ่มเลขพัสดุ"
4. Fill: Tracking = `TH123456789`, Courier = `Kerry`
5. Status changes to `SHIPPED`

### 4. Confirm Receipt

1. Login as buyer: `buyer@example.com`
2. Go to "รายการซื้อ" (My Purchases)
3. Click on the deal
4. Click "ยืนยันรับสินค้า"
5. Status changes to `RELEASED` ✅

### 5. Try Opening a Dispute

1. Repeat steps 1-3 above with a new deal
2. Instead of confirming, click "เปิดข้อพิพาท"
3. Select reason, add description
4. Upload evidence (enter any URL)
5. Status changes to `DISPUTE`

### 6. Resolve as Admin

1. Login as admin: `admin@example.com`
2. Go to http://localhost:3000/admin/disputes
3. Review the dispute
4. Click "คืนเงินให้ผู้ซื้อ" or "โอนเงินให้ผู้ขาย"
5. Dispute is resolved!

## Troubleshooting

### "Cannot connect to database"

```bash
# Check if postgres is running
docker compose ps

# Restart services
docker compose restart postgres api

# Check logs
docker compose logs postgres
```

### "Port 3000 already in use"

```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or change port in docker-compose.yml
ports:
  - "3001:3000"  # Change 3000 to 3001
```

### "pnpm install fails"

```bash
# Clear cache and retry
rm -rf node_modules pnpm-lock.yaml
pnpm install --no-frozen-lockfile
```

### "Migrations fail"

```bash
# Reset database
docker compose down -v  # Warning: deletes all data
docker compose up -d postgres
docker compose exec api pnpm prisma migrate deploy
docker compose exec api pnpm prisma db seed
```

## Stopping the Platform

```bash
# Stop all services (keeps data)
docker compose stop

# Stop and remove everything (deletes data)
docker compose down -v
```

## Development Mode (Without Docker)

If you prefer to run services locally:

```bash
# 1. Start Postgres + Redis only
docker compose up -d postgres redis

# 2. Install dependencies
pnpm install

# 3. Setup database
pnpm db:migrate
pnpm db:seed

# 4. Start dev servers
pnpm dev

# API will be on :4000
# Web will be on :3000
```

## Next Steps

- Read [README.md](README.md) for full documentation
- Read [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
- Check [apps/api/src/routes](apps/api/src/routes) for API endpoints
- Check [apps/web/src/app](apps/web/src/app) for frontend pages

## Getting Help

- Check logs: `docker compose logs -f api web`
- Open an issue on GitHub
- Read the full README.md

**Happy coding! 🚀**
