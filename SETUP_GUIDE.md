# Setup Guide

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Environment

```bash
cp .env.example .env
```

Edit `.env` if needed (defaults work for local dev).

### 3. Start Database & Redis

```bash
cd infra
docker compose up -d postgres redis
```

Wait for services to be healthy (~10 seconds).

### 4. Setup Database

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed demo data
pnpm db:seed
```

### 5. Start Development Servers

**Option A: Using Turbo (recommended)**

```bash
pnpm dev
```

This starts both API (port 3001) and Web (port 3000).

**Option B: Manual**

Terminal 1 (API):
```bash
cd apps/api
pnpm dev
```

Terminal 2 (Web):
```bash
cd apps/web
pnpm dev
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **API Health**: http://localhost:3001/health
- **Prisma Studio**: `pnpm db:studio` (opens on port 5555)

## Demo Credentials

After seeding, you can use:

- **Buyer**: `buyer@example.com` (OTP: `123456`)
- **Seller**: `seller@example.com` (OTP: `123456`)
- **Admin**: `admin@example.com` (OTP: `123456`)

## Testing the Flow

### 1. Create a Deal (Seller)

1. Login as seller (email OTP: `123456`)
2. Go to `/seller/deal/new`
3. Create a deal (e.g., "iPhone 13", 35000 THB)
4. Copy the paylink URL

### 2. Pay as Buyer

1. Open paylink in incognito/another browser
2. See QR code
3. Click "อัปสลิป (Mock)" button
4. Status changes to HOLD

### 3. Ship (Seller)

1. Go to seller dashboard
2. Click "เพิ่มเลขพัสดุ"
3. Add tracking: `TH123456789`, Courier: `Kerry Express`
4. Status changes to SHIPPED

### 4. Confirm (Buyer)

1. Go to buyer deals
2. Click "ยืนยันรับของ"
3. Status changes to RELEASED

### 5. Dispute Flow (Optional)

1. Buyer opens dispute at `/buyer/dispute/:dealId`
2. Admin resolves at `/admin/disputes`

## Docker Compose (Full Stack)

To run everything in Docker:

```bash
cd infra
docker compose up -d
```

This starts:
- PostgreSQL (5432)
- Redis (6379)
- API (3001)
- Web (3000)

## Troubleshooting

### Database Connection Error

```bash
# Check if PostgreSQL is running
docker ps

# Check logs
docker compose logs postgres

# Restart services
docker compose restart postgres
```

### Port Already in Use

Change ports in:
- `.env` (for local dev)
- `infra/docker-compose.yml` (for Docker)

### Prisma Migration Issues

```bash
# Reset database (WARNING: deletes all data)
pnpm --filter api prisma migrate reset

# Or manually
pnpm --filter api prisma migrate dev
```

### Module Not Found Errors

```bash
# Rebuild packages
pnpm --filter @essy/core build
pnpm --filter @essy/payment build
```

## Production Deployment

1. Set all environment variables
2. Use real PostgreSQL (not Docker)
3. Use real Redis (not Docker)
4. Build for production:
   ```bash
   pnpm build
   ```
5. Use Docker Compose or deploy separately

## Next Steps

- Integrate real Thai PSP (Opn/Omise, Xendit)
- Complete LINE OAuth integration
- Add file upload (S3/Cloudflare R2)
- Add email/SMS notifications
- Add real-time updates (WebSocket)
