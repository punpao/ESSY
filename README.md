# Thai Social-Commerce Escrow MVP

PromptPay-first escrow platform designed to reduce second-hand fraud on Facebook, Instagram และ LINE. ผู้ซื้อจ่ายผ่าน QR แล้วระบบ “พักเงิน” จนกว่าจะกดยืนยันรับของ หรือระบบยืนยันว่าจัดส่งสำเร็จ ภายในมี UI สำหรับผู้ขาย ผู้ซื้อ และทีมปฏิบัติการ (Ops) เพื่อตัดสินข้อพิพาทอย่างรวดเร็ว

## What This MVP Includes
- End-to-end flow: สร้าง Paylink → ชำระเงิน → พักเงิน (HOLD) → ผู้ขายใส่เลขพัสดุ → ผู้ซื้อกดยืนยันหรือ Auto Release
- Dispute center ภาษาไทยพร้อมแนบหลักฐาน, Ops ตัดสินได้ทั้ง REFUND หรือ RELEASE
- PromptPay Mock Provider พร้อมลายเซ็น webhook และ BullMQ worker ตรวจ auto-release 48 ชม.
- Verified Seller + คะแนนความน่าเชื่อถือ (sigmoid) + Audit log (`deal_events`)
- LINE mock login + Email OTP fallback, JWT auth guard ตามบทบาท
- Fastify + Prisma API, Next.js 14 App Router UI (Tailwind + shadcn), shared UI kit, state machine in `packages/core`
- Database schema + seed data (3 users, 3 deals across states, 1 dispute + evidence)
- Tests: Vitest (state machine + API validation) & Playwright e2e (API-level scenarios)
- Docker Compose (Postgres, Redis, API, Web, Worker)

## Out of Scope (Future work)
- Real PSP integrations (Opn/Omise, Xendit, GB PrimePay)
- Production-ready LINE Login flow (ใช้ mock callback สำหรับ demo)
- File storage (selfie / evidence เก็บเป็น URL)
- Advanced risk scoring, notification service, SLA dashboards beyond badges

## Monorepo Layout
```
apps/
  api/      Fastify + Prisma backend
  web/      Next.js 14 frontend (buyer/seller/admin)
packages/
  core/     Shared types + escrow state machine
  payment/  Payment provider abstraction + Mock PromptPay
  ui/       Shared shadcn-based components
infra/
  prisma/   Schema + migrations + seed
  docker-compose.yml
```

## Getting Started

1. **Install dependencies**
   ```bash
   corepack enable
   pnpm install
   ```

2. **Copy env template**
   ```bash
   cp .env.example .env
   ```
   Adjust secrets if needed (JWT, LINE, webhook).

3. **Database setup**
   ```bash
   pnpm db:migrate:dev   # prisma migrate dev --schema infra/prisma/schema.prisma
   pnpm db:seed          # seeds demo users/deals/dispute
   ```

4. **Run locally (pnpm + turbo)**
   ```bash
   pnpm dev              # runs api, web, worker in parallel (hot reload)
   ```
   - API: http://localhost:4000/api/v1
   - Web: http://localhost:3000

5. **Docker Compose**
   ```bash
   cd infra
   docker compose up --build
   ```
   Services: `postgres`, `redis`, `api`, `worker`, `web`

## Key Commands
| Goal | Command |
| --- | --- |
| Run unit tests | `pnpm test` |
| Run Playwright e2e | `pnpm test:e2e` (expects API on localhost:4000) |
| Prisma migrate deploy | `pnpm db:migrate` |
| Prisma seed | `pnpm db:seed` |
| Start worker only | `pnpm --filter api worker` |

## Demo Flow (Screenshots placeholders)
1. **Seller สร้าง Paylink** – `docs/screenshots/seller-paylink.png` *(placeholder)*  
2. **Buyer สแกน PromptPay / ชำระ** – `docs/screenshots/buyer-pay.png` *(placeholder)*  
3. **Ops ตัดสินข้อพิพาท** – `docs/screenshots/admin-dispute.png` *(placeholder)*

## Testing Strategy
- `packages/core`: Vitest verifies state machine transitions + guard rejections  
- `apps/api`: Vitest for Zod validation & schema parsing  
- `apps/web/tests/e2e.spec.ts`: Playwright API-mode covers
  1. Paylink → payment → HOLD  
  2. Ship → Buyer confirm → RELEASED  
  3. Dispute → Admin refund → REFUND

Run tests after `pnpm install` and `pnpm db:seed` (DB + Redis must be available).

## Next Steps Toward Production
- Replace Mock PromptPay with real PSP adapters in `packages/payment`
- Implement real LINE OAuth + session refresh, add admin audit trails
- Harden security: rate limiting, IP/device fingerprints, anti-tamper evidence uploads
- Monitoring & alerting around BullMQ jobs, dispute SLAs, ledger reconciliation
- Add automated emails/LINE Notify for payment & dispute updates
