# Repository Tree

```
essy-monorepo/
├── apps/
│   ├── api/                          # Fastify REST API
│   │   ├── prisma/
│   │   │   └── schema.prisma        # Database schema
│   │   ├── src/
│   │   │   ├── __tests__/
│   │   │   │   └── escrowMachine.test.ts
│   │   │   ├── routes/
│   │   │   │   ├── admin.ts         # Admin endpoints
│   │   │   │   ├── auth.ts          # LINE/Email OAuth
│   │   │   │   ├── deals.ts         # Deal CRUD
│   │   │   │   ├── disputes.ts      # Dispute management
│   │   │   │   ├── paylink.ts       # Public paylink
│   │   │   │   ├── payments.ts      # Payment webhooks
│   │   │   │   └── seller.ts        # Seller KYC
│   │   │   ├── scripts/
│   │   │   │   └── seed.ts          # Seed data
│   │   │   ├── workers/
│   │   │   │   └── autoRelease.ts   # BullMQ worker
│   │   │   ├── auth.ts              # JWT auth setup
│   │   │   ├── config.ts            # Environment config
│   │   │   ├── db.ts                # Prisma client
│   │   │   └── index.ts             # Fastify server
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   │
│   └── web/                          # Next.js 14 App Router
│       ├── e2e/
│       │   └── basic.spec.ts        # Playwright tests
│       ├── src/
│       │   ├── app/
│       │   │   ├── admin/
│       │   │   │   ├── deals/       # Admin deal management
│       │   │   │   └── disputes/    # Admin dispute resolution
│       │   │   ├── buyer/
│       │   │   │   ├── deals/       # Buyer deal list
│       │   │   │   └── dispute/     # Open dispute
│       │   │   ├── pay/
│       │   │   │   └── [token]/     # Public paylink page
│       │   │   ├── seller/
│       │   │   │   ├── dashboard/   # Seller dashboard
│       │   │   │   ├── deal/
│       │   │   │   │   └── new/     # Create paylink
│       │   │   │   └── kyc/         # KYC submission
│       │   │   ├── globals.css      # Tailwind styles
│       │   │   ├── layout.tsx       # Root layout
│       │   │   └── page.tsx         # Landing page
│       │   ├── components/
│       │   │   └── DealStatusBadge.tsx
│       │   └── lib/
│       │       └── utils.ts
│       ├── package.json
│       ├── next.config.js
│       ├── playwright.config.ts
│       ├── postcss.config.js
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── vitest.config.ts
│
├── packages/
│   ├── core/                         # Shared types & state machine
│   │   ├── src/
│   │   │   ├── state/
│   │   │   │   └── escrowMachine.ts # State machine logic
│   │   │   ├── types/
│   │   │   │   └── index.ts         # TypeScript types
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   │
│   ├── payment/                      # Payment provider abstraction
│   │   ├── src/
│   │   │   ├── mockPromptPay.ts     # Mock PromptPay provider
│   │   │   ├── types.ts             # Payment interfaces
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   │
│   └── ui/                           # Shared UI components (shadcn)
│       ├── src/
│       │   ├── button.tsx            # Button component
│       │   ├── utils.ts              # cn() utility
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── infra/
│   ├── docker-compose.yml            # Full stack Docker setup
│   ├── Dockerfile.api                # API container
│   └── Dockerfile.web                # Web container
│
├── .env.example                      # Environment template
├── .eslintrc.json                    # ESLint config
├── .gitignore
├── .prettierrc                       # Prettier config
├── package.json                      # Root package.json
├── pnpm-workspace.yaml               # pnpm workspace
├── README.md                         # Main documentation
├── tsconfig.json                     # Root TypeScript config
└── turbo.json                        # TurboRepo config
```

## Key Files Summary

### Backend (API)
- **State Machine**: `packages/core/src/state/escrowMachine.ts` - Exhaustive escrow state transitions
- **Schema**: `apps/api/prisma/schema.prisma` - All database models
- **Routes**: `apps/api/src/routes/*` - All REST endpoints
- **Worker**: `apps/api/src/workers/autoRelease.ts` - Auto-release & reputation jobs

### Frontend (Web)
- **Landing**: `apps/web/src/app/page.tsx` - Thai-first landing page
- **Paylink**: `apps/web/src/app/pay/[token]/page.tsx` - Public payment page
- **Seller**: `apps/web/src/app/seller/*` - Seller dashboard & KYC
- **Buyer**: `apps/web/src/app/buyer/*` - Buyer deals & disputes
- **Admin**: `apps/web/src/app/admin/*` - Admin management

### Infrastructure
- **Docker**: `infra/docker-compose.yml` - Full stack setup
- **Config**: `.env.example` - All environment variables

### Testing
- **Unit**: `apps/api/src/__tests__/escrowMachine.test.ts`
- **E2E**: `apps/web/e2e/basic.spec.ts`
