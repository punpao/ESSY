# Architecture Documentation

## System Overview

Thai Escrow Platform is a monorepo-based web application providing secure escrow services for Thai social commerce.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Buyer     │  │   Seller    │  │    Admin    │         │
│  │     UI      │  │     UI      │  │     UI      │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                 │                 │                │
│         └─────────────────┴─────────────────┘                │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                     Next.js 14 (SSR)
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                      API Layer                               │
│                           │                                  │
│              ┌────────────▼────────────┐                     │
│              │   Fastify REST API      │                     │
│              │  /api/v1/{resource}     │                     │
│              └────────┬────────────────┘                     │
│                       │                                      │
│         ┌─────────────┼─────────────┐                        │
│         │             │             │                        │
│    ┌────▼────┐   ┌───▼────┐   ┌───▼────┐                   │
│    │  Auth   │   │ Deals  │   │Disputes│                   │
│    │ Service │   │Service │   │Service │                   │
│    └─────────┘   └────────┘   └────────┘                   │
│                                                              │
└───────────────────────────┬──────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                    Data Layer                                │
│         ┌──────────────────┴──────────────────┐              │
│         │                                     │              │
│    ┌────▼─────┐                        ┌─────▼─────┐        │
│    │PostgreSQL│                        │   Redis   │        │
│    │  Prisma  │                        │  BullMQ   │        │
│    └──────────┘                        └───────────┘        │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    Background Workers                         │
│                                                              │
│   ┌────────────────┐         ┌──────────────────┐           │
│   │  Auto-Release  │         │   Reputation     │           │
│   │    Worker      │         │   Recalculator   │           │
│   │  (every 15min) │         │                  │           │
│   └────────────────┘         └──────────────────┘           │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│               External Services (Mock in MVP)                 │
│                                                              │
│   ┌────────────────┐         ┌──────────────────┐           │
│   │   PromptPay    │         │   LINE Login     │           │
│   │   Mock QR      │         │   OAuth2 (Mock)  │           │
│   └────────────────┘         └──────────────────┘           │
└──────────────────────────────────────────────────────────────┘
```

## State Machine

The core escrow logic is implemented as a finite state machine:

```
                  ┌─────────┐
                  │ PENDING │
                  └────┬────┘
                       │ payment_received
                       │ (buyer pays)
                  ┌────▼────┐
           ┌──────┤  HOLD   ├──────┐
           │      └────┬────┘      │
           │           │           │
           │      add_tracking     │
           │           │           │
           │      ┌────▼────┐      │
           │      │ SHIPPED │      │
           │      └────┬────┘      │
           │           │           │
           │    confirm_received   │
           │     or auto_release   │
           │           │           │
 open_dispute     ┌────▼────┐     open_dispute
           │      │RELEASED │      │
           │      └─────────┘      │
           │                       │
      ┌────▼────┐                  │
      │ DISPUTE │◄─────────────────┘
      └────┬────┘
           │
    ┌──────┴──────┐
    │             │
resolve_refund  resolve_release
    │             │
┌───▼───┐    ┌───▼────┐
│REFUND │    │RELEASED│
└───────┘    └────────┘
```

## Data Flow

### 1. Create Deal Flow

```
Seller → POST /deals
         ↓
      Validate Input
         ↓
      Generate ULID
         ↓
   Create Deal (PENDING)
         ↓
   Return Paylink URL
```

### 2. Payment Flow

```
Buyer → GET /pay/{token}
        ↓
     Display QR
        ↓
     POST /payments/create
        ↓
  Mock Provider: Generate QR
        ↓
  Buyer "Pays" (webhook)
        ↓
  POST /payments/webhook/mock
        ↓
  Update Payment → PAID
        ↓
  Update Deal → HOLD
        ↓
  Notify Parties
```

### 3. Auto-Release Flow

```
BullMQ Cron (every 15 min)
        ↓
  Query Deals WHERE
    status=SHIPPED AND
    auto_release_at < NOW() AND
    no open disputes
        ↓
   For each deal:
     - Transition to RELEASED
     - Create DealEvent
     - Add ReputationEvent
     - Queue reputation recalc
```

## Security Architecture

### Authentication Flow

```
User → Email/LINE
       ↓
    Generate OTP/OAuth
       ↓
    Verify Credentials
       ↓
    Generate JWT
       ↓
Store in localStorage (Client)
       ↓
   Include in Authorization header
       ↓
  Validate JWT on API requests
```

### Authorization Guards

- **Public**: Landing page, Paylink view
- **Authenticated**: Create deals, view own data
- **Role-based**:
  - Buyer: Open disputes, confirm receipt
  - Seller: Create deals, add tracking
  - Admin: Resolve disputes, force actions

### Input Validation

All API inputs validated with Zod schemas:

```typescript
const CreateDealSchema = z.object({
  title: z.string().min(1).max(200),
  amount_satang: z.number().int().positive(),
  buyer_note: z.string().optional(),
});
```

## Database Design

### Key Tables

1. **User**: Core user data + role
2. **SellerProfile**: KYC, reputation, PromptPay info
3. **Deal**: Main escrow record
4. **Payment**: Provider transactions
5. **Dispute**: Buyer complaints
6. **Evidence**: Dispute attachments
7. **DealEvent**: Audit trail

### Indexes

- `Deal.status` - Fast filtering
- `Deal.paylink_token` - Unique lookup
- `Deal.auto_release_at` - Worker queries
- `Payment.provider_ref` - Webhook lookups
- `Dispute.status` - Admin filtering

## Scalability Considerations

### Current MVP Limits

- Single Postgres instance
- Single Redis instance
- No CDN
- No horizontal scaling

### Production Scaling Path

1. **Database**:
   - Read replicas for analytics
   - Connection pooling (PgBouncer)
   - Partitioning on `created_at`

2. **API**:
   - Multiple Fastify instances behind load balancer
   - Stateless (JWT in client)
   - Rate limiting per IP/user

3. **Workers**:
   - Multiple BullMQ workers
   - Job prioritization
   - Dead letter queue for failures

4. **Caching**:
   - Redis for session data
   - CDN for static assets (Cloudflare)
   - Query result caching (short TTL)

## Error Handling

### Error Response Format

```json
{
  "error": "Human-readable message",
  "code": "ERROR_CODE",
  "details": { /* optional */ }
}
```

### Status Codes

- `200`: Success
- `400`: Validation error
- `401`: Unauthorized
- `403`: Forbidden (wrong role)
- `404`: Resource not found
- `500`: Internal server error

## Monitoring & Observability

### Logging

- Fastify logger (pino)
- Structured JSON logs
- Log levels: error, warn, info, debug

### Metrics (TODO for Production)

- Request latency (p50, p95, p99)
- Error rate by endpoint
- Active deals by status
- Payment success rate
- Dispute resolution time

### Alerts (TODO for Production)

- API downtime
- Database connection failures
- Payment webhook failures
- SLA breaches (disputes > 72h)

---

## Technology Choices

### Why Fastify?

- Fastest Node.js framework
- Schema-based validation
- Plugin ecosystem
- TypeScript support

### Why Next.js 14 App Router?

- Server components (performance)
- Built-in routing
- SEO-friendly (SSR)
- Developer experience

### Why Prisma?

- Type-safe database queries
- Migration management
- Excellent TypeScript integration
- Active community

### Why BullMQ?

- Reliable job queue
- Redis-based (fast)
- Repeat/cron jobs
- Job prioritization

### Why Monorepo?

- Code sharing (packages/core, packages/payment)
- Atomic commits across API + Web
- Unified TypeScript config
- Single deployment pipeline

---

## Future Enhancements

### Short-term (1-3 months)

- [ ] Real payment provider integration
- [ ] Email/SMS notifications
- [ ] Mobile responsive improvements
- [ ] Advanced analytics dashboard

### Mid-term (3-6 months)

- [ ] Multi-currency support
- [ ] Installment payments
- [ ] Seller subscription tiers
- [ ] API for third-party integrations

### Long-term (6-12 months)

- [ ] Mobile apps (React Native)
- [ ] Chatbot for dispute resolution
- [ ] AI fraud detection
- [ ] Blockchain audit trail
