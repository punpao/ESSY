# Thailand Social-Commerce Escrow (PromptPay-first)

This repo contains a full-stack MVP for a Thai-focused escrow platform that fixes PayPal’s pain points in local social-commerce flows (Facebook / IG / LINE chat commerce).

## What This MVP Delivers
- PromptPay-first escrow: buyers scan QR, funds stay on hold until confirmation or auto-release (48h after delivery).
- Thai-first UX across buyer, seller, and ops dashboards with localized messaging.
- Paylink workflow for sellers inside chat, mock PromptPay provider, fast dispute handling for ops.
- Verified Seller badge with KYC capture, reputation scoring worker, and detailed deal events.
- Seeded demo data (buyer, verified seller, admin) plus example deals in different states.

### Out of Scope
- Real PSP integration (currently mocked PromptPay webhook).
- Real file uploads (selfie/receipt stored as URLs).
- Production-grade auth (LINE Login stubbed, email OTP uses DB storage, tokens signed with shared secret).

---

## Monorepo Structure
```
apps/
  api/        Fastify + Prisma REST API
  web/        Next.js 14 App Router frontend
packages/
  core/       Shared types + escrow state machine
  payment/    Payment provider abstraction + Mock PromptPay
  ui/         Reusable shadcn-based UI components
infra/
  schema.prisma   Database schema (migrations emitted to infra/migrations)
  docker-compose.yml + Dockerfiles
tests/
  e2e/        Playwright API-driven end-to-end flows
```

---

## Getting Started

### 1. Install dependencies
```bash
pnpm install
```

### 2. Provision Postgres + Redis (or use Docker)
```bash
docker compose -f infra/docker-compose.yml up -d postgres redis
```

### 3. Migrate & seed database
```bash
pnpm db:migrate
pnpm db:seed
```

### 4. Run all apps in dev mode
```bash
pnpm dev
```
- API: http://localhost:4000/api/v1
- Web: http://localhost:3000

Environment variables needed (see `.env.example`):
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `APP_BASE_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- `PAYMENT_WEBHOOK_SECRET`

> TIP: For local dev, copy `.env.example` to `.env` at the repo root.

---

## Running Tests

### Vitest unit tests
```bash
pnpm test
```
- `packages/core` – escrow state machine
- `packages/payment` – PromptPay mock
- `apps/api/test` – Zod validation sanity checks

### Playwright end-to-end flows (API-level)
```bash
pnpm test:e2e
```
Scenarios:
1. Seller creates paylink → buyer pays via mock PromptPay → seller ships → buyer confirms release.
2. Buyer opens dispute → admin refunds → deal transitions to `REFUND`.

> Requires API running (use `pnpm dev` or `docker compose up`).

---

## Dockerized Runtime
```
docker compose up -d
```
Services:
- `postgres`: Postgres 15
- `redis`: Redis 7
- `api`: Fastify service (builds with pnpm, runs on port 4000)
- `web`: Next.js (static build served via `next start`, exposed on 3000)

---

## Key Backend Highlights
- Fastify + Zod typed routes (`/api/v1/*`).
- Prisma schema in `infra/schema.prisma` with migrations emitted to `infra/migrations`.
- Escrow state machine (`packages/core/state/escrowMachine.ts`):
  ```
  PENDING → HOLD → SHIPPED → RELEASED
                  ↘ DISPUTE → REFUND | RELEASED
  ```
- BullMQ worker (`apps/api/src/plugins/jobs.ts`) every 15 min:
  - Auto-release deals past `autoReleaseAt` with no open dispute.
  - Recalculate seller reputation (`sigmoid(#released * 0.3 – #disputes * 1.0)`).
- Deal events logged to `DealEvent` table for auditability.
- Email OTP stored in DB (mock email – OTP returned via API for demo).
- LINE login endpoint accepts mock payloads (suitable for future integration).

### REST Endpoints (selection)
- `POST /auth/email/request` / `verify`
- `POST /deals` (seller) → returns paylink URL
- `GET /paylinks/:token` (public view)
- `POST /payments/create` + `/payments/webhook/mock`
- `POST /deals/:id/ship` | `/confirm` | `/cancel`
- `POST /disputes/:dealId/open` | `/disputes/:id/evidence` | `/resolve`
- Admin dashboards: `GET /admin/deals`, `GET /admin/disputes`, `POST /admin/deals/:id/release`

---

## Frontend Highlights (Next.js 14 App Router)
- Thai-first copy with shadcn-styled components from `@escrow/ui`.
- Auth context with local storage (email OTP mock). Login buttons available in nav.
- Key routes:
  - `/` Landing page “โอนแล้วพักเงินจนกว่าคุณจะกดยืนยัน”
  - `/pay/[token]` Buyer PromptPay QR flow (explicit messaging about funds on hold)
  - `/seller/dashboard`, `/seller/deal/new`, `/seller/kyc`
  - `/buyer/deals`, `/buyer/dispute/[id]`
  - `/admin/deals`, `/admin/disputes`
- Forms and toasts in Thai, state badges via shared UI package.

---

## Seed Data
After `pnpm db:seed` you get:
- Admin: `ops@escrow.th`
- Verified seller (`seller@escrow.th`) with PromptPay info + reputation events.
- Buyer (`buyer@escrow.th`)
- Deals:
  - HOLD (funds on hold)
  - SHIPPED (tracking + auto-release scheduled)
  - DISPUTE (open case with evidence)

---

## Next Steps Toward Production
- Integrate real Thai PSPs (Opn/Omise, Xendit, GB PrimePay) by implementing new providers in `packages/payment`.
- Replace OTP/email + LINE stubs with production OAuth + messaging.
- Harden uploads with actual storage (S3/MinIO).
- Expand dispute tooling (SLA dashboard, evidence viewer, messaging).
- Add monitoring (metrics/log shipping) & enforce secrets rotation.
- Add more E2E coverage including UI flows (Playwright browser).

---

## Screenshots (placeholders)
- [ ] Seller dashboard
- [ ] Buyer payment QR
- [ ] Admin dispute queue

*(Add actual screenshots once available.)*

---

ขอบคุณที่ลองใช้! 🎉  
Feedback & pull requests ยินดีเสมอครับ/ค่ะ
