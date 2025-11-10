# Architecture Overview

## Monorepo Structure

```
essy-monorepo/
├── apps/
│   ├── api/          # Fastify REST API (Node.js + TypeScript)
│   └── web/          # Next.js 14 Frontend (React + TypeScript)
├── packages/
│   ├── core/         # Shared types & escrow state machine
│   ├── payment/      # PaymentProvider abstraction + MockPromptPay
│   └── ui/           # Shared UI components (shadcn/ui)
└── infra/            # Docker Compose & deployment configs
```

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Fastify (TypeScript)
- **Database**: PostgreSQL + Prisma ORM
- **Queue**: BullMQ (Redis)
- **Auth**: Mock LINE OAuth + Email OTP (magic link)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS + shadcn/ui
- **Language**: TypeScript
- **Styling**: Tailwind CSS

### Infrastructure
- **Containerization**: Docker Compose
- **Database**: PostgreSQL 15
- **Cache/Queue**: Redis 7

## Key Components

### 1. Escrow State Machine (`packages/core`)

Pure TypeScript state machine implementing:
```
PENDING → HOLD → SHIPPED → RELEASED
         ↓         ↓
      DISPUTE → (REFUND | RELEASED)
```

**States:**
- `PENDING`: Deal created, awaiting payment
- `HOLD`: Payment received, funds held
- `SHIPPED`: Seller added tracking
- `RELEASED`: Funds released to seller
- `DISPUTE`: Buyer opened dispute
- `REFUND`: Funds refunded to buyer

**Events:**
- `PAYMENT_RECEIVED`
- `SHIPPED`
- `BUYER_CONFIRMED`
- `AUTO_RELEASE`
- `DISPUTE_OPENED`
- `DISPUTE_RESOLVED_REFUND`
- `DISPUTE_RESOLVED_RELEASE`

### 2. Payment Provider (`packages/payment`)

Abstract interface for payment providers:
```typescript
interface PaymentProvider {
  createCharge(request): Promise<ChargeResponse>
  refund(request): Promise<RefundResponse>
  verifyWebhook(payload, signature): boolean
  parseWebhook(payload): WebhookPayload
}
```

**Current Implementation:**
- `MockPromptPayProvider`: Mock provider for MVP
- Returns QR string and provider_ref
- Simulates webhook callbacks

**Future Implementations:**
- Opn Payment
- Omise
- Xendit
- GB PrimePay

### 3. Database Schema (Prisma)

**Core Tables:**
- `User`: Authentication & roles
- `SellerProfile`: KYC, verification, reputation
- `Deal`: Escrow deals with status tracking
- `Payment`: Payment records
- `Dispute`: Dispute cases
- `Evidence`: Uploaded evidence
- `ReputationEvent`: Reputation scoring
- `DealEvent`: Audit trail

### 4. API Routes (`apps/api/src/routes`)

**Auth:**
- `/auth/line/callback` - LINE OAuth
- `/auth/email/request` - Email OTP request
- `/auth/email/verify` - Email OTP verify

**Seller:**
- `/seller/me` - Get profile
- `/seller/verify/basic` - Submit KYC
- `/seller/verify/approve` - Admin approve

**Deals:**
- `/deals` - Create deal
- `/deals/:id` - Get deal
- `/deals/paylink/:token` - Public paylink
- `/deals/:id/ship` - Add tracking
- `/deals/:id/confirm` - Buyer confirm
- `/deals/:id/cancel` - Cancel deal

**Payments:**
- `/payments/create` - Create charge
- `/payments/webhook/mock` - Mock webhook
- `/payments/:dealId/refund` - Admin refund

**Disputes:**
- `/disputes/:dealId/open` - Open dispute
- `/disputes/:id/evidence` - Add evidence
- `/disputes/:id/resolve` - Admin resolve

**Admin:**
- `/admin/deals` - List deals
- `/admin/disputes` - List disputes
- `/admin/deals/:id/release` - Force release

### 5. Workers (`apps/api/src/workers`)

**Auto-Release Worker:**
- Checks `auto_release_at` every 15 minutes
- Transitions `SHIPPED` → `RELEASED` if conditions met
- Conditions: `delivered_at` + 48h passed, no open dispute

**Reputation Worker:**
- Recalculates seller reputation after each deal
- Formula: `sigmoid(#released * 0.3 - #disputes * 1.0)`
- Updates `SellerProfile.reputation_score`

### 6. Frontend Pages (`apps/web/src/app`)

**Public:**
- `/` - Landing page
- `/pay/:token` - Public paylink (QR code)

**Seller:**
- `/seller/dashboard` - Deals list
- `/seller/deal/new` - Create paylink
- `/seller/kyc` - KYC verification

**Buyer:**
- `/buyer/deals` - My deals
- `/buyer/dispute/:id` - Open dispute

**Admin:**
- `/admin/deals` - Manage deals
- `/admin/disputes` - Triage disputes

## Data Flow

### Payment Flow
1. Seller creates deal → Returns `paylink_url`
2. Buyer opens paylink → Sees QR code
3. Buyer clicks "อัปสลิป" → Calls `/payments/webhook/mock`
4. Webhook updates `Payment.status = PAID`
5. Webhook transitions `Deal.status = HOLD`
6. Funds are held until buyer confirms or auto-release

### Escrow Flow
1. **PENDING**: Deal created, awaiting payment
2. **HOLD**: Payment received, funds held
3. **SHIPPED**: Seller adds tracking number
4. **RELEASED**: Buyer confirms OR auto-release after 48h
5. **DISPUTE**: Buyer opens dispute (can happen from HOLD or SHIPPED)
6. **REFUND/RELEASED**: Admin resolves dispute

### Dispute Flow
1. Buyer opens dispute → `Deal.status = DISPUTE`
2. Buyer uploads evidence (images, chatlogs)
3. Admin reviews dispute
4. Admin resolves:
   - `RESOLVED_REFUND` → `Deal.status = REFUND`
   - `RESOLVED_RELEASE` → `Deal.status = RELEASED`

## Security (MVP Level)

- Role-based auth guards
- Zod input validation
- State transition validation
- File uploads as URLs (mock S3)
- Audit trail (`DealEvent`) on every state change
- **No real money** - Mock provider only

## Testing

### Unit Tests (Vitest)
- State machine transitions
- API validation
- Payment provider logic

### E2E Tests (Playwright)
- Seller creates paylink → Buyer pays → HOLD
- Seller adds tracking → Buyer confirms → RELEASED
- Buyer opens dispute → Admin resolves

## Deployment

### Docker Compose
```bash
docker compose -f infra/docker-compose.yml up -d
```

Services:
- `postgres`: Database
- `redis`: Queue/cache
- `api`: Fastify API (port 3001)
- `web`: Next.js frontend (port 3000)

### Environment Variables
See `.env.example` for all required variables.

## Next Steps (Post-MVP)

1. **Real PSP Integration**
   - Replace `MockPromptPayProvider` with real providers
   - Implement Opn/Omise/Xendit/GB PrimePay

2. **Production Security**
   - JWT authentication
   - Rate limiting
   - CSRF protection
   - Input sanitization

3. **Enhanced Features**
   - Real-time notifications (WebSocket)
   - Email notifications
   - SMS OTP
   - Advanced reputation algorithms
   - Admin SLA tracking
