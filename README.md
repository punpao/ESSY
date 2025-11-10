# ESSY - Social-Commerce Escrow Platform (MVP)

**โอนแล้วพักเงินจนกว่าคุณจะกดยืนยัน**

ESSY is a Thailand-focused escrow platform designed to solve second-hand social buying fraud on Facebook, Instagram, and LINE. It provides PromptPay-first escrow, social chat paylinks, Thai UX, fast local dispute resolution, and Verified Seller + Reputation systems.

## 🎯 What This MVP Does

### Core Features
- ✅ **PromptPay-first Escrow**: Mock PromptPay QR payment flow
- ✅ **Social Paylinks**: Create shareable payment links for chat apps
- ✅ **Escrow State Machine**: PENDING → HOLD → SHIPPED → RELEASED (with DISPUTE branch)
- ✅ **Auto-release**: Automatic fund release after 48h if buyer doesn't confirm
- ✅ **Dispute System**: Buyer can open disputes, admin can resolve (REFUND/RELEASE)
- ✅ **Seller Verification**: KYC flow with PromptPay ID + selfie (mock)
- ✅ **Reputation System**: Weighted reputation score calculation
- ✅ **Thai-first UX**: All copy in Thai, optimized for Thai users

### User Journeys (Fully Implemented)
1. **Seller creates Paylink** → Buyer pays via PromptPay QR (mock) → Money status = HOLD
2. **Seller adds tracking** → Buyer confirms received (or auto-release) → RELEASE funds
3. **If problem** → Buyer opens Dispute → Admin can REFUND or RELEASE

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+
- Docker & Docker Compose

### Local Development

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Start infrastructure (Postgres + Redis)**
   ```bash
   docker compose -f infra/docker-compose.yml up -d postgres redis
   ```

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

   This will start:
   - Frontend: http://localhost:3000
   - API: http://localhost:3001

### Docker (Full Stack)

```bash
docker compose -f infra/docker-compose.yml up -d
```

Access:
- Frontend: http://localhost:3000
- API: http://localhost:3001
- Postgres: localhost:5432
- Redis: localhost:6379

## 📁 Project Structure

```
.
├── apps/
│   ├── api/              # Fastify REST API
│   │   ├── src/
│   │   │   ├── routes/   # API routes (auth, deals, payments, disputes, admin)
│   │   │   ├── workers/  # BullMQ workers (auto-release, reputation)
│   │   │   └── scripts/  # Seed script
│   │   └── prisma/       # Prisma schema & migrations
│   └── web/              # Next.js 14 frontend
│       └── src/app/      # App Router pages
├── packages/
│   ├── core/             # Shared types & escrow state machine
│   ├── payment/          # PaymentProvider abstraction + MockPromptPay
│   └── ui/               # Shared UI components (shadcn/ui)
└── infra/
    └── docker-compose.yml
```

## 🗄️ Database Schema

### Core Tables
- **User**: Users with roles (buyer/seller/admin), LINE/email auth
- **SellerProfile**: Seller verification, PromptPay ID, reputation score
- **Deal**: Escrow deals with status tracking
- **Payment**: Payment records (mock PromptPay)
- **Dispute**: Dispute cases with evidence
- **Evidence**: Uploaded evidence (images, chatlogs)
- **ReputationEvent**: Reputation scoring events
- **DealEvent**: Audit trail for state changes

## 🔌 API Endpoints

### Auth
- `POST /api/v1/auth/line/callback` - LINE OAuth callback
- `POST /api/v1/auth/email/request` - Request email OTP
- `POST /api/v1/auth/email/verify` - Verify email OTP

### Seller
- `GET /api/v1/seller/me` - Get seller profile
- `POST /api/v1/seller/verify/basic` - Submit KYC (PromptPay + selfie)
- `POST /api/v1/seller/verify/approve` - Admin approve seller

### Deals
- `POST /api/v1/deals` - Create deal → returns paylink_url
- `GET /api/v1/deals/:id` - Get deal details
- `GET /api/v1/deals/paylink/:token` - Get deal by paylink token (public)
- `POST /api/v1/deals/:id/ship` - Add tracking → SHIPPED
- `POST /api/v1/deals/:id/confirm` - Buyer confirms → RELEASED
- `POST /api/v1/deals/:id/cancel` - Cancel deal (PENDING only)

### Payments
- `POST /api/v1/payments/create` - Create payment charge → returns QR
- `POST /api/v1/payments/webhook/mock` - Mock webhook callback
- `POST /api/v1/payments/:dealId/refund` - Admin refund

### Disputes
- `POST /api/v1/disputes/:dealId/open` - Open dispute
- `POST /api/v1/disputes/:id/evidence` - Add evidence
- `POST /api/v1/disputes/:id/resolve` - Admin resolve (REFUND/RELEASE)

### Admin
- `GET /api/v1/admin/deals` - List deals with filters
- `GET /api/v1/admin/disputes` - List disputes
- `POST /api/v1/admin/deals/:id/release` - Force release

## 🧪 Testing

### Unit Tests (Vitest)
```bash
pnpm test
```

### E2E Tests (Playwright)
```bash
pnpm test:e2e
```

## 🔄 Escrow State Machine

```
PENDING → [PAYMENT_RECEIVED] → HOLD → [SHIPPED] → SHIPPED
                                                      ↓
                                              [BUYER_CONFIRMED]
                                              [AUTO_RELEASE]
                                                      ↓
                                                 RELEASED

HOLD → [DISPUTE_OPENED] → DISPUTE → [DISPUTE_RESOLVED_REFUND] → REFUND
                                    [DISPUTE_RESOLVED_RELEASE] → RELEASED
```

## 🎨 Frontend Pages

- `/` - Landing page (Thai copy)
- `/pay/:token` - Public paylink page (QR code + payment)
- `/seller/dashboard` - Seller deals list
- `/seller/deal/new` - Create new paylink
- `/seller/kyc` - KYC verification form
- `/buyer/deals` - Buyer's deals list
- `/buyer/dispute/:id` - Open dispute form
- `/admin/disputes` - Admin dispute triage
- `/admin/deals` - Admin deals management

## 🔐 Security & Compliance (MVP Level)

- Role-based auth guards on all endpoints
- Zod validation for all inputs
- State transition validation
- File uploads as URLs (mock S3)
- Audit trail (deal_events) on every state change
- **No real money handling** - Mock provider only

## 🚧 What's NOT Included (Out of Scope)

- Real PSP integration (Opn/Omise/Xendit/GB PrimePay)
- Real LINE OAuth (mock only)
- Real email OTP (mock only)
- Real file storage (URLs only)
- Real KYC verification (mock only)
- PSP licensing/compliance
- Production-grade security (JWT, rate limiting, etc.)

## 📝 Environment Variables

See `.env.example` for all required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `LINE_CHANNEL_ID` / `LINE_CHANNEL_SECRET` - LINE OAuth (mock)
- `PAYMENT_WEBHOOK_SECRET` - Webhook verification secret
- `AUTO_RELEASE_HOURS` - Auto-release timeout (default: 48)

## 🎯 Next Steps (Post-MVP)

1. **Integrate Real PSP**
   - Implement Opn/Omise/Xendit/GB PrimePay providers
   - Replace MockPromptPayProvider

2. **Real LINE OAuth**
   - Complete LINE Login integration
   - Store LINE user profile

3. **File Storage**
   - Integrate S3/Cloudflare R2 for evidence uploads
   - Image optimization

4. **Production Security**
   - JWT token authentication
   - Rate limiting
   - CSRF protection
   - Input sanitization

5. **Enhanced Features**
   - Real-time notifications (WebSocket)
   - Email notifications
   - SMS OTP
   - Advanced reputation algorithms
   - Admin SLA tracking

## 📄 License

MIT

## 👥 Demo Accounts

After seeding:
- **Buyer**: buyer@example.com
- **Seller**: seller@example.com (Verified)
- **Admin**: admin@example.com

## 🐛 Troubleshooting

### Database connection issues
```bash
# Check Postgres is running
docker ps | grep postgres

# Reset database
docker compose -f infra/docker-compose.yml down -v
docker compose -f infra/docker-compose.yml up -d postgres
pnpm db:migrate
pnpm db:seed
```

### Port conflicts
Change ports in `docker-compose.yml` or `.env` files.

### Build errors
```bash
# Clean and rebuild
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
pnpm --filter @essy/core build
pnpm --filter @essy/payment build
pnpm --filter @essy/ui build
```

---

**Built with ❤️ for Thailand's social commerce ecosystem**
