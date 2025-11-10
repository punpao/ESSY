# Setup Guide - Thai Escrow MVP

## 🚀 Quick Start (3 minutes)

### Step 1: Install Dependencies

```bash
# Ensure you have Node 18+ and pnpm 8+
node --version  # Should be 18+
pnpm --version  # Should be 8+

# Install all packages
pnpm install
```

### Step 2: Start Database Services

```bash
# Option A: Using Docker (Recommended)
docker compose up -d postgres redis

# Option B: Using local Postgres + Redis
# Make sure they're running on default ports (5432, 6379)
```

### Step 3: Setup Database

```bash
# Run migrations
pnpm db:migrate

# Seed demo data
pnpm db:seed
```

### Step 4: Start Development Servers

```bash
# Start both API + Web in parallel
pnpm dev
```

**🎉 Done! Access the app:**
- Frontend: http://localhost:3000
- API: http://localhost:3001
- API Health: http://localhost:3001/health

---

## 📧 Test Accounts

Login with these emails (OTP is logged to console, or use any 6-digit code):

- `admin@escrow.local` - Admin (resolve disputes)
- `seller@escrow.local` - Verified Seller (create deals)
- `buyer@escrow.local` - Buyer (has active deals)

---

## 🧪 Testing the Flow

### 1. Create a Deal (as Seller)

```bash
1. Login as seller@escrow.local
2. Go to http://localhost:3000/seller/dashboard
3. Click "สร้าง Paylink"
4. Fill: "Test Product", 10000 (= ฿100.00)
5. Copy the paylink
```

### 2. Pay for Deal (as Buyer)

```bash
1. Open paylink in incognito/new browser
2. Click "แสดง QR Code ชำระเงิน"
3. Click "จำลองชำระเงิน (Mock)" button
4. See confirmation message
```

### 3. Ship Deal (as Seller)

```bash
1. Refresh seller dashboard
2. Deal now shows "พักเงินแล้ว (HOLD)"
3. Click "เพิ่ม Tracking"
4. Enter: TH123456, Kerry Express
5. Submit
```

### 4. Confirm Receipt (as Buyer)

```bash
1. Login as buyer@escrow.local
2. Go to http://localhost:3000/buyer/deals
3. Find the deal (status: จัดส่งแล้ว)
4. Click "ยืนยันรับสินค้า"
5. Funds released to seller!
```

### 5. Alternative: Open Dispute

```bash
1. Instead of confirming, click "เปิดข้อพิพาท"
2. Select reason: "ของไม่ตรงปก"
3. Write details
4. Submit
```

### 6. Resolve Dispute (as Admin)

```bash
1. Login as admin@escrow.local
2. Go to http://localhost:3000/admin/disputes
3. See the open dispute
4. Click "คืนเงินผู้ซื้อ (Refund)" or "ปล่อยเงินให้ผู้ขาย (Release)"
5. Enter note
6. Done!
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Prisma Issues

```bash
# Regenerate Prisma client
cd apps/api
pnpm prisma generate

# Reset database (WARNING: deletes all data)
pnpm prisma migrate reset
```

### Docker Issues

```bash
# Stop all containers
docker compose down

# Remove volumes (fresh start)
docker compose down -v

# Rebuild images
docker compose build --no-cache
```

### Can't Connect to Database

```bash
# Check if Postgres is running
docker ps | grep postgres

# Check connection string
cat .env | grep DATABASE_URL

# Test connection
psql postgresql://postgres:postgres@localhost:5432/escrow
```

---

## 📦 What Was Built

### Backend API (Fastify)
- ✅ Authentication (Email OTP + JWT)
- ✅ Deal CRUD + state transitions
- ✅ Payment creation + webhook
- ✅ Dispute management
- ✅ Admin actions
- ✅ Seller KYC
- ✅ Auto-release worker (BullMQ)

### Frontend (Next.js 14)
- ✅ Landing page
- ✅ Login/Auth
- ✅ Seller dashboard + create deal
- ✅ Payment page (public)
- ✅ Buyer deals + dispute
- ✅ Admin disputes + deals management
- ✅ Thai language throughout

### Infrastructure
- ✅ Monorepo (TurboRepo)
- ✅ Docker Compose
- ✅ Prisma migrations
- ✅ Seed data
- ✅ State machine with tests
- ✅ TypeScript strict mode

---

## 🔑 Key Files to Review

**State Machine:**
- `packages/core/src/state/escrowMachine.ts`
- `packages/core/src/state/escrowMachine.test.ts`

**Database Schema:**
- `apps/api/prisma/schema.prisma`

**API Routes:**
- `apps/api/src/routes/*.ts` (auth, deals, payments, disputes, admin, seller)

**Frontend Pages:**
- `apps/web/src/app/page.tsx` (landing)
- `apps/web/src/app/seller/dashboard/page.tsx`
- `apps/web/src/app/buyer/deals/page.tsx`
- `apps/web/src/app/admin/disputes/page.tsx`
- `apps/web/src/app/pay/[token]/page.tsx`

**Worker:**
- `apps/api/src/worker.ts` (auto-release job)

**Seed Data:**
- `apps/api/prisma/seed.ts`

---

## 📚 Next Steps

To make this production-ready:

1. **Replace mock payment** with real PromptPay PSP (Opn/Omise/Xendit)
2. **Add real LINE Login** OAuth flow
3. **Implement file uploads** for dispute evidence (S3/R2)
4. **Add notifications** (LINE Notify, Email)
5. **Security hardening** (rate limiting, CSRF, webhook signatures)
6. **Monitoring** (Sentry, CloudWatch)
7. **Load testing** (k6, Artillery)
8. **CI/CD** (GitHub Actions, automated testing)

---

## 💡 Tips

- Check console logs for OTP codes during development
- Use Prisma Studio to inspect database: `pnpm db:studio`
- State machine enforces business rules - check tests for all transitions
- All Thai copy is in `packages/core/src/types.ts` (DEAL_STATUS_LABELS_TH)

---

**Happy coding! 🇹🇭**
