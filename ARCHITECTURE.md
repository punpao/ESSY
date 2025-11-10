# 🏗️ Architecture Documentation

## System Overview

Thai Escrow Platform is a full-stack TypeScript monorepo that implements an escrow service for Thai social commerce.

---

## Core Concepts

### 1. Escrow State Machine

The heart of the system is a pure state machine that governs deal flow:

```typescript
// Location: packages/core/src/state/escrowMachine.ts

States: PENDING | HOLD | SHIPPED | RELEASED | DISPUTE | REFUND

Transitions:
- PAY: PENDING → HOLD (payment received)
- SHIP: HOLD → SHIPPED (tracking added)
- CONFIRM: SHIPPED → RELEASED (buyer confirms)
- AUTO_RELEASE: SHIPPED → RELEASED (48h timeout)
- OPEN_DISPUTE: HOLD/SHIPPED → DISPUTE
- RESOLVE_REFUND: DISPUTE → REFUND
- RESOLVE_RELEASE: DISPUTE → RELEASED
```

**Guards:**
- Cannot SHIP if tracking already exists
- Cannot CONFIRM if dispute is open
- Cannot OPEN_DISPUTE if already resolved
- AUTO_RELEASE only if auto_release_at has passed

### 2. Money Flow

```
Buyer → PromptPay QR → Mock Gateway → HOLD (escrow)
                                        ↓
                                   [48h timer starts]
                                        ↓
                        Buyer Confirms OR Auto-Release
                                        ↓
                                    RELEASED
                                        ↓
                                  Seller receives funds
```

**Important:** In MVP, money is NOT actually moved. The mock provider only simulates the flow. For production, integrate real PSP.

### 3. Database Schema

```
User ──┬─→ SellerProfile ──→ ReputationEvent
       │
       ├─→ Deal (as seller)
       ├─→ Deal (as buyer)
       ├─→ Dispute (as buyer)
       └─→ Evidence (as uploader)

Deal ──┬─→ Payment
       ├─→ Dispute
       └─→ DealEvent (audit trail)

Dispute ──→ Evidence
```

**Key Relations:**
- One User can be both buyer and seller
- One Deal has one Payment (single charge model)
- One Deal can have multiple Disputes (though typically one at a time)
- All state changes logged in DealEvent

---

## API Architecture

### Request Flow

```
Client Request
    ↓
Fastify (CORS + JWT middleware)
    ↓
Route Handler
    ↓
Auth Check (JWT verification)
    ↓
Role Check (buyer/seller/admin)
    ↓
Input Validation (Zod schema)
    ↓
Business Logic
    ↓
State Machine Guard
    ↓
Prisma Transaction
    ↓
Event Logging
    ↓
Response
```

### Authentication

JWT payload:
```typescript
{
  userId: string;
  role: "buyer" | "seller" | "admin";
}
```

Token stored in `localStorage` (frontend) and passed in `Authorization: Bearer <token>` header.

**Production TODO:** Use httpOnly cookies instead of localStorage for XSS protection.

---

## Background Jobs

### BullMQ Worker Architecture

```
Redis ← BullMQ Queue ← API (schedules jobs)
  ↓
Worker Process (auto-release.ts)
  ↓
Cron Schedule (every 15 min)
  ↓
Query Deals with auto_release_at < now
  ↓
For each deal:
  - Check no open dispute
  - Transition to RELEASED
  - Update seller reputation
  - Log event
```

**Scaling:** BullMQ supports multiple workers. In production, run 2-3 worker instances for redundancy.

---

## Frontend Architecture

### Next.js 14 App Router

```
app/
├── page.tsx                    # Landing (public)
├── pay/[token]/page.tsx        # Payment page (public)
├── seller/
│   ├── dashboard/page.tsx      # Seller home (auth required)
│   ├── deal/new/page.tsx       # Create deal
│   └── kyc/page.tsx            # KYC verification
├── buyer/
│   └── deals/page.tsx          # Buyer orders (auth required)
└── admin/
    └── disputes/page.tsx       # Admin panel (admin only)
```

**Data Fetching:**
- Client-side fetch with JWT token
- No SSR for authenticated pages (simplicity)
- Production TODO: Use Next.js Server Components + API route proxy

### Component Structure

```
@thai-escrow/ui (shared components)
    ↓
Button, Card, Badge, StatusBadge
    ↓
Used in all apps
```

**Styling:** Tailwind CSS with CSS variables for theming.

---

## Payment Provider Abstraction

```typescript
// Interface
abstract class PaymentProvider {
  abstract createCharge(input): Promise<ChargeResult>;
  abstract refund(input): Promise<RefundResult>;
  abstract verifyWebhook(payload): Promise<VerificationResult>;
}

// Mock Implementation
class MockPromptPayProvider extends PaymentProvider {
  // Generates fake QR code
  // Simulates webhook callbacks
}

// Future Implementations
class OmiseProvider extends PaymentProvider { ... }
class GBPrimePayProvider extends PaymentProvider { ... }
class XenditProvider extends PaymentProvider { ... }
```

**Provider Selection:**
```typescript
const provider = process.env.PAYMENT_PROVIDER === "omise"
  ? new OmiseProvider(config)
  : new MockPromptPayProvider(config);
```

---

## Security Model

### Authentication
- JWT tokens (HS256)
- 7-day expiry
- Refresh tokens NOT implemented (MVP)

### Authorization
- Role-based: buyer, seller, admin
- Resource-level: only seller/buyer/admin can view their own deals

### Input Validation
- All inputs validated with Zod schemas
- Prisma provides SQL injection protection

### State Machine Guards
- Prevents invalid state transitions
- E.g., cannot confirm if dispute open

### Audit Trail
- Every state change logged in `DealEvent`
- Includes actor_id, timestamp, metadata

---

## Scalability Considerations

### Current MVP Limits
- Single Fastify instance (no clustering)
- BullMQ single worker
- No CDN for static assets
- No caching layer

### Production Scaling Path

**Horizontal Scaling:**
```
Load Balancer
    ↓
API Instance 1 ──┬──→ PostgreSQL (primary)
API Instance 2 ──┤
API Instance 3 ──┘
    ↓
Redis Cluster
    ↓
Worker 1 ──┬──→ BullMQ Queue
Worker 2 ──┘
```

**Database:**
- Read replicas for reporting queries
- Connection pooling (PgBouncer)
- Partitioning for large tables (Deal, DealEvent)

**Caching:**
- Redis for hot data (user sessions, seller profiles)
- CDN for static assets (Cloudflare)

**Monitoring:**
- Prometheus + Grafana for metrics
- Sentry for error tracking
- DataDog for logs

---

## Testing Strategy

### Unit Tests (Vitest)
- State machine logic
- Utility functions
- Input validation schemas

### Integration Tests
- API route handlers
- Database transactions
- Payment provider mocks

### E2E Tests (Playwright)
- Critical user flows
- Happy path + error cases
- Cross-browser (Chrome, Firefox, Safari)

### Load Tests
- Apache Bench / k6
- Target: 100 req/s per instance
- Monitor: DB connection pool, Redis memory

---

## Deployment Architecture

### Development
```
Docker Compose
├── postgres:15-alpine
├── redis:7-alpine
├── api (Fastify)
├── web (Next.js)
└── worker (BullMQ)
```

### Production (Example: Railway)
```
Services:
├── API (Node.js)
│   ├── Health checks
│   ├── Auto-scaling (2-10 instances)
│   └── Env vars from Railway config
├── Web (Next.js)
│   ├── Edge deployment
│   └── Auto-deploy on git push
├── Worker (Node.js)
│   └── Single instance (no scaling needed)
├── PostgreSQL (managed)
│   └── Daily backups
└── Redis (managed)
    └── Persistence enabled
```

---

## Technical Decisions

### Why Fastify over Express?
- 2x faster (native async/await)
- Built-in schema validation
- Better TypeScript support

### Why Prisma over raw SQL?
- Type-safe queries
- Auto-generated types
- Migration system
- Works with multiple databases

### Why BullMQ over Agenda?
- Redis-based (faster)
- Better concurrency control
- Production-ready features (retries, rate limiting)

### Why Next.js over CRA?
- SSR/SSG capabilities (future)
- File-based routing
- API routes (optional)
- Better SEO

### Why Monorepo?
- Shared types between frontend/backend
- Single source of truth
- Easier refactoring
- TurboRepo for fast builds

---

## Known Limitations (MVP)

1. **No real payment gateway** - Mock only
2. **No email/SMS notifications** - Console logs only
3. **No file upload** - URLs only (S3 not integrated)
4. **No rate limiting** - Can be DoS'd
5. **No caching** - Every request hits DB
6. **No CDN** - Static assets served from origin
7. **No monitoring** - No metrics/alerts
8. **No backups** - Manual only
9. **No load balancing** - Single instance
10. **No HTTPS** - HTTP only (use reverse proxy in prod)

---

## Future Enhancements

### Phase 2 (Production-Ready)
- Real PSP integration
- Email/SMS via SendGrid + Twilio
- S3 for file uploads
- Rate limiting (express-rate-limit)
- Redis caching layer
- SSL/TLS certificates
- Monitoring (Sentry + DataDog)

### Phase 3 (Scale)
- Multi-region deployment
- GraphQL API (Apollo)
- WebSocket for real-time updates
- Mobile app (React Native)
- Microservices architecture (if needed)

### Phase 4 (Advanced)
- ML-based fraud detection
- Smart contract escrow (blockchain)
- Multi-currency support
- Installment payments
- Insurance partnership

---

## Contributing

See the main README for contribution guidelines.

---

**Last Updated:** 2025-01-10
