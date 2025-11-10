# PromptSafe Escrow MVP (Thailand Social Commerce)

PromptSafe is a PromptPay-first escrow platform that fixes Thai social commerce pain points: safer Facebook/Instagram/LINE trades, verified sellers, dispute SLAs, and Thai-first UX copy.

## 🚀 Feature Snapshot
- **End-to-end escrow flow**: create paylink → PromptPay payment → hold → ship → release/refund
- **Fastify API** (TypeScript) with Prisma/PostgreSQL, Redis, BullMQ workers
- **Next.js 14 App Router** frontend covering buyer / seller / admin journeys
- **Auth**: LINE Login (mock) + email OTP magic link fallback
- **Payment providers**: pluggable interface + Mock PromptPay QR implementation
- **Escrow state machine** (`packages/core`) with exhaustive guards & unit tests
- **Seed data**: 3 users + multi-state deals + open dispute with evidence
- **Tooling**: pnpm + TurboRepo, ESLint/Prettier, Vitest, Playwright, Docker Compose

## 🗂 Repository Layout
```
apps/
  api/          Fastify REST API + workers + Prisma
  web/          Next.js (buyer / seller / admin, Thai UX)
packages/
  core/         Shared types, Zod schemas, escrow state machine, reputation helpers
  payment/      PaymentProvider abstraction + Mock PromptPay
  ui/           Shared React UI primitives (shadcn-flavoured)
infra/
  docker-compose.yml
  dockerfiles/
  migrations/   Prisma SQL snapshot
```

## 🧑‍💻 Local Development
```bash
pnpm install

# database setup
pnpm db:migrate
pnpm db:seed

# start api + web concurrently
pnpm dev
```

- API base: `http://localhost:4000/api/v1`
- Web app: `http://localhost:3000`

Login via `/login` (email OTP mock) or LINE mock button. Seed users:

| Role   | Email                 | Notes                     |
|--------|-----------------------|---------------------------|
| Buyer  | `buyer@escrow.local`  | OTP login, deals seeded   |
| Seller | `seller@escrow.local` | Verified seller profile   |
| Admin  | `admin@escrow.local`  | Accesses admin dashboards |

## 🧪 Testing
```bash
pnpm test        # Vitest (core + api validation)
pnpm test:e2e    # Playwright basic smoke (requires dev server)
```

## 🐳 Docker Compose
```bash
docker compose -f infra/docker-compose.yml up --build
```
Services: `postgres`, `redis`, `api` (4000), `web` (3000). override env via `.env`.

## 🔁 Background Jobs
Workers (BullMQ):
- **Auto release**: scans `auto_release_at` every 15 min and releases funds when eligible
- **Reputation recalculation**: sigmoid weighting (#released vs #disputes)

## 📦 Seeded Scenario Highlights
- Deals covering `HOLD`, `RELEASED`, `DISPUTE`
- PromptPay QR strings and mock provider references
- One dispute with 2 evidence attachments for admin workflow demo

## 📝 Next Steps / Roadmap Ideas
- Integrate real Thai PSPs (Opn/Omise, Xendit, GB PrimePay) via `packages/payment`
- Add production LINE Login flow and email delivery (SES, SendGrid)
- Expand admin tooling (bulk actions, SLA metrics dashboard)
- Mobile-first responsive optimisations, push notifications
- Harden audit trails & add permissioned access logs

> Screenshots / GIF placeholders: add hero, paylink modal, admin dispute queue once UI is final.

Ship fast, stay safe — สังคมซื้อขายปลอดโกง 🇹🇭
