# SocialTrust Escrow MVP

PromptPay-first escrow platform that helps Thai social-commerce buyers and sellers stay safe.  
This MVP solves “โอนแล้วพักเงิน” and fast dispute management for Facebook / Instagram / LINE transactions.

## Highlights

- **PromptPay QR escrow** – paylinks create QR codes and hold funds until confirmation or delivery evidence.
- **Thai-first UX** – Thai copy, simplified flows, mock OTP login, and localized dispute reasons.
- **Fast dispute tooling** – operations dashboard with SLA badges, evidence uploads, and one-click refund/release.
- **Verified Sellers & reputation** – PromptPay + selfie KYC, auto-scored seller reputation, audit trail of state changes.
- **Safe defaults** – strict state machine (`PENDING → HOLD → SHIPPED → RELEASED` with dispute branches), auto-release worker, Zod validation, role-based guards.

## Architecture

```
apps/
  api/   Fastify + Prisma + BullMQ worker
  web/   Next.js 14 App Router + Tailwind + shadcn/ui
packages/
  core/  Shared types, escrow state machine, validation
  ui/    Shared UI primitives
  payment/ PaymentProvider interface + Mock PromptPay
infra/
  docker-compose.yml (postgres, redis, api, worker, web)
```

## Getting Started

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Environment**

   ```bash
   cp .env.example .env.local
   # adjust values if needed (defaults match docker-compose)
   ```

3. **Database migration & seed**

   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

4. **Run dev servers (Turbo)**

   ```bash
   pnpm dev
   ```

   - Next.js → http://localhost:3000
   - Fastify API → http://localhost:4000/api/v1

5. **Docker alternative**

   ```bash
   docker compose -f infra/docker-compose.yml up -d
   ```

   Builds and runs Postgres, Redis, API, worker, and web containers.

## Seeded Demo Accounts

| Role   | Email                       | Notes                                                                 |
|--------|-----------------------------|-----------------------------------------------------------------------|
| Seller | `seller@socialtrust.th`     | Verified seller profile & sample deals                               |
| Buyer  | `buyer@socialtrust.th`      | Has active deals and disputes                                        |
| Admin  | `admin@socialtrust.th`      | Operations dashboard access                                          |

- Use **email OTP flow** (mock) on `/login`. After requesting OTP the API returns `otpPreview` for convenience.
- LINE login demo buttons map to roles (`demo-seller`, `demo-buyer`, `demo-admin`) when environment is set to `LINE_CHANNEL_ID=demo`.

## Testing

```bash
pnpm test       # Vitest unit tests (state machine, validation)
pnpm test:e2e   # Playwright API flow tests (escrow + disputes)
```

Playwright flows cover:
1. Seller creates paylink → buyer pays via mock PromptPay → status moves to HOLD/RELEASED.
2. Dispute flow from buyer open to admin refund resolution.

## Key Flows Illustrated

![Landing placeholder](docs/screenshots/landing-placeholder.svg)
![Seller dashboard placeholder](docs/screenshots/seller-dashboard-placeholder.svg)

(Add real screenshots later; placeholders keep README scannable.)

## Production Hardening – Next Steps

- Integrate real Thai PSP (Opn/Omise, Xendit, GB PrimePay) behind the payment provider interface.
- Replace mock OTP with real email/SMS delivery, add LINE OAuth consent screen.
- Harden webhook security (signature rotation, replay protection) and add idempotency keys.
- Enhance audit logging & monitoring (structured logs, metrics, alerting).
- Expand reputation scoring with weighted events and buyer feedback loops.

---

Built for “ship fast but safe” – the codebase separates core state logic, API, UI, and payment infrastructure so each can evolve independently. PRs welcome! 
