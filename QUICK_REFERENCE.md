# Quick Reference - Thai Escrow MVP

## 🚀 Start Development (One Command)

```bash
# Install → Migrate → Seed → Dev (all in one)
pnpm install && docker compose up -d postgres redis && pnpm db:migrate && pnpm db:seed && pnpm dev
```

Access:
- **Web**: http://localhost:3000
- **API**: http://localhost:3001

---

## 📧 Demo Logins

| Email                 | Role   | Features                     |
|-----------------------|--------|------------------------------|
| seller@escrow.local   | Seller | Create deals, add tracking   |
| buyer@escrow.local    | Buyer  | Pay, confirm, open dispute   |
| admin@escrow.local    | Admin  | Resolve disputes, force actions |

**OTP**: Check console logs or use any 6-digit code (e.g., `123456`)

---

## 📂 Key Files to Review

### State Machine (Core Business Logic)
```
packages/core/src/state/escrowMachine.ts
packages/core/src/state/escrowMachine.test.ts
```

### Database Schema
```
apps/api/prisma/schema.prisma
```

### API Routes
```
apps/api/src/routes/
├── auth.ts       # Email OTP, JWT
├── deals.ts      # Create, ship, confirm, cancel
├── payments.ts   # QR code, webhook, refund
├── disputes.ts   # Open, evidence, resolve
├── seller.ts     # KYC, profile
└── admin.ts      # Triage, stats
```

### Frontend Pages
```
apps/web/src/app/
├── page.tsx                    # Landing
├── auth/login/page.tsx         # Login
├── seller/dashboard/page.tsx   # Seller dashboard
├── buyer/deals/page.tsx        # Buyer deals
├── admin/disputes/page.tsx     # Admin triage
└── pay/[token]/page.tsx        # Payment page
```

### Background Worker
```
apps/api/src/worker.ts          # Auto-release job (BullMQ)
```

---

## 🧪 Test Demo Flow (2 minutes)

### 1. Create Deal as Seller
```bash
# 1. Open http://localhost:3000/auth/login
# 2. Login: seller@escrow.local, OTP: any 6 digits
# 3. Click "สร้าง Paylink"
# 4. Enter: "Test Product", 10000 (฿100)
# 5. Copy paylink (e.g., /pay/pl_xxx...)
```

### 2. Pay as Buyer
```bash
# 1. Open paylink in incognito mode
# 2. Click "แสดง QR Code ชำระเงิน"
# 3. Click "จำลองชำระเงิน (Mock)"
# 4. See "ชำระเงินแล้ว!"
```

### 3. Ship as Seller
```bash
# 1. Back to seller dashboard (refresh)
# 2. Deal shows "พักเงินแล้ว (HOLD)"
# 3. Click "เพิ่ม Tracking"
# 4. Enter: TH123456, Kerry Express
# 5. Submit
```

### 4. Confirm as Buyer
```bash
# 1. Login as buyer@escrow.local
# 2. Go to "รายการซื้อของฉัน"
# 3. Click "ยืนยันรับสินค้า"
# 4. Done! Funds released to seller
```

---

## 📊 Useful Commands

### Development
```bash
pnpm dev              # Start all apps (API + Web)
pnpm build            # Build everything
pnpm lint             # ESLint
pnpm format           # Prettier
```

### Database
```bash
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed demo data
pnpm db:studio        # Open Prisma Studio GUI
pnpm db:push          # Push schema changes (dev only)
```

### Testing
```bash
pnpm test             # Run Vitest unit tests
pnpm test:e2e         # Run Playwright e2e tests
cd packages/core && pnpm test  # Test state machine only
```

### Docker
```bash
pnpm docker:up        # Start all containers
pnpm docker:down      # Stop all containers
pnpm docker:logs      # View logs
docker compose exec api sh  # Shell into API container
```

---

## 🔧 Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

**Key variables** (defaults work for local dev):
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/escrow
REDIS_URL=redis://localhost:6379
JWT_SECRET=change_me
AUTO_RELEASE_HOURS=48
```

---

## 📦 API Endpoints Quick Reference

### Auth
```
POST /api/v1/auth/email/request    # Request OTP
POST /api/v1/auth/email/verify     # Verify OTP → JWT
GET  /api/v1/auth/me                # Get current user
```

### Deals
```
POST /api/v1/deals                  # Create deal (seller)
GET  /api/v1/deals/:id              # Get deal details
GET  /api/v1/deals/token/:token     # Get deal by paylink (public)
POST /api/v1/deals/:id/ship         # Add tracking
POST /api/v1/deals/:id/confirm      # Buyer confirms receipt
GET  /api/v1/deals/my/all           # Get my deals
```

### Payments
```
POST /api/v1/payments/create        # Generate QR code
POST /api/v1/payments/webhook/mock  # Mock payment callback
POST /api/v1/payments/:dealId/refund  # Admin refund
```

### Disputes
```
POST /api/v1/disputes/:dealId/open  # Open dispute (buyer)
POST /api/v1/disputes/:id/evidence  # Add evidence
POST /api/v1/disputes/:id/resolve   # Resolve (admin)
GET  /api/v1/disputes/:id           # Get dispute details
```

### Admin
```
GET  /api/v1/admin/deals            # List all deals
GET  /api/v1/admin/disputes         # List all disputes
POST /api/v1/admin/deals/:id/release  # Force release
GET  /api/v1/admin/stats            # Platform stats
```

### Seller
```
GET  /api/v1/seller/me              # Get seller profile
POST /api/v1/seller/verify/basic    # Submit KYC
POST /api/v1/seller/verify/approve  # Admin approve KYC
```

---

## 🎯 State Machine Quick Reference

### States
```
PENDING → HOLD → SHIPPED → RELEASED
    ↓       ↓        ↓
CANCELLED  DISPUTE → (REFUND | RELEASED)
```

### Valid Transitions
```
PENDING → HOLD      (guard: hasPayment + hasBuyer)
PENDING → CANCELLED (guard: !hasPayment)
HOLD → SHIPPED      (guard: hasTracking)
HOLD → DISPUTE      (buyer only)
SHIPPED → RELEASED  (buyer confirms OR auto-release)
SHIPPED → DISPUTE   (buyer only)
DISPUTE → REFUND    (admin only)
DISPUTE → RELEASED  (admin only)
```

---

## 🗄️ Database Schema Quick Reference

### Tables
```
User          - id, role, email, kyc_level
SellerProfile - user_id, verified, promptpay_id, reputation_score
Deal          - id, title, amount_satang, status, paylink_token, tracking_number
Payment       - deal_id, provider, provider_ref, status, paid_at
Dispute       - deal_id, opened_by, reason_text, status
Evidence      - dispute_id, uploaded_by, kind, url
ReputationEvent - seller_id, type, weight
DealEvent     - deal_id, event_type, from_status, to_status (audit log)
```

### Key Indexes
```
Deal: status, seller_id, buyer_id, paylink_token, auto_release_at
Payment: status, deal_id, provider_ref
Dispute: status, deal_id
User: email, line_sub
```

---

## 🚨 Common Issues & Solutions

### Port already in use
```bash
lsof -ti:3000 | xargs kill -9  # Kill web
lsof -ti:3001 | xargs kill -9  # Kill API
```

### Prisma client out of sync
```bash
cd apps/api
pnpm prisma generate
```

### Database connection failed
```bash
# Check Postgres is running
docker ps | grep postgres

# Test connection
psql postgresql://postgres:postgres@localhost:5432/escrow
```

### Redis connection failed
```bash
# Check Redis is running
docker ps | grep redis

# Test connection
redis-cli ping  # Should return "PONG"
```

### Build errors
```bash
# Clean build cache
rm -rf .turbo node_modules apps/*/node_modules packages/*/node_modules
pnpm install
pnpm build
```

---

## 📝 Code Style

### TypeScript
- Strict mode enabled
- No `any` types (use `unknown` if needed)
- All functions have return types
- Use Zod for runtime validation

### API Routes
```typescript
fastify.post('/:id/action', {
  onRequest: [fastify.authenticate],  // JWT auth
  handler: async (request, reply) => {
    const user = requireAuth(request);  // Get user
    const { id } = request.params;      // Get params
    const body = schema.parse(request.body);  // Validate
    // ... business logic
    return { success: true, data };
  },
});
```

### State Transitions
```typescript
// Always use state machine
const newStatus = EscrowStateMachine.transition(
  currentStatus,
  'EVENT_NAME',
  { /* context */ }
);

// Create audit log
await prisma.dealEvent.create({
  data: {
    deal_id,
    event_type: 'event_name',
    from_status: currentStatus,
    to_status: newStatus,
    actor_id: user.id,
  },
});
```

---

## 🎨 Thai UX Copy Reference

### Status Labels
```typescript
PENDING: 'รอชำระเงิน'
HOLD: 'พักเงินแล้ว'
SHIPPED: 'จัดส่งแล้ว'
RELEASED: 'โอนเงินให้ผู้ขายแล้ว'
DISPUTE: 'กำลังพิจารณาข้อพิพาท'
REFUND: 'คืนเงินแล้ว'
```

### Dispute Reasons
```typescript
not_received: 'ของยังไม่ถึง'
not_as_described: 'ของไม่ตรงปก'
other: 'อื่น ๆ'
```

### Key Messages
```
"เงินยังไม่เข้าผู้ขาย จนกว่าคุณจะกดยืนยันรับของ"
"โอนแล้วพักเงินจนกว่าคุณจะยืนยัน"
```

---

## 📖 Documentation

- **README.md** - Full project overview
- **SETUP.md** - Step-by-step setup guide
- **ARCHITECTURE.md** - System architecture diagrams
- **PROJECT_SUMMARY.md** - What was built
- **QUICK_REFERENCE.md** - This file (cheat sheet)

---

## 🔗 Useful Links

```bash
# Local development
http://localhost:3000         # Web app
http://localhost:3001         # API server
http://localhost:3001/health  # Health check

# Tools
http://localhost:5555         # Prisma Studio (run: pnpm db:studio)
```

---

## 🚀 Next Steps for Production

1. **Payment Provider**
   - Sign up for Opn/Omise/Xendit
   - Implement real provider in `packages/payment`
   - Add webhook signature verification

2. **Real Auth**
   - Set up LINE Login OAuth
   - Get LINE Channel ID/Secret
   - Implement token refresh

3. **File Uploads**
   - Set up S3/R2 bucket
   - Add file upload endpoint
   - Resize images

4. **Notifications**
   - Set up SendGrid/Mailgun
   - Implement LINE Notify
   - Add SMS via Twilio

5. **Deploy**
   - Deploy API to Railway/Fly.io
   - Deploy Web to Vercel
   - Set up production DB (Supabase/Railway)
   - Configure CI/CD (GitHub Actions)

---

**Pro tip**: Keep this file open while developing! 🚀
