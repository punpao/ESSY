# ESSY - Thailand Social-Commerce Escrow Platform MVP

ระบบพักเงินสำหรับการซื้อขายออนไลน์ในประเทศไทย - แก้ปัญหาการโกงในการซื้อขายมือสองผ่าน Facebook/Instagram/LINE

## 🎯 เป้าหมาย

แก้ปัญหาการโกงในการซื้อขายมือสอง โดยใช้ระบบ Escrow ที่:
- **PromptPay-first**: ชำระผ่าน QR Code PromptPay
- **Social Chat Paylink**: ส่งลิงก์ชำระเงินในแชท
- **Thai UX**: ออกแบบสำหรับผู้ใช้ไทย
- **Fast Local Dispute**: จัดการข้อพิพาทได้รวดเร็ว
- **Verified Seller + Reputation**: ระบบคะแนนและยืนยันตัวตน

## 🏗️ สถาปัตยกรรม

Monorepo ที่ใช้:
- **pnpm** + **TurboRepo** สำหรับจัดการ workspace
- **Backend**: Node.js + Fastify (TypeScript)
- **Frontend**: Next.js 14 App Router (TypeScript) + Tailwind + shadcn/ui
- **Database**: PostgreSQL + Prisma ORM
- **Queue/Jobs**: BullMQ (Redis)
- **Payments**: PaymentProvider abstraction (Mock PromptPay สำหรับ MVP)
- **Containerization**: Docker Compose

## 📁 โครงสร้างโปรเจกต์

```
/
├── apps/
│   ├── api/          # Fastify REST API
│   └── web/          # Next.js Frontend
├── packages/
│   ├── core/         # Shared types & state machine
│   ├── payment/      # PaymentProvider interface
│   └── ui/           # Shared UI components (shadcn)
├── infra/
│   └── docker-compose.yml
└── README.md
```

## 🚀 วิธีติดตั้งและรัน

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose (สำหรับรันฐานข้อมูล)

### 1. ติดตั้ง Dependencies

```bash
pnpm install
```

### 2. Setup Database

```bash
# Start PostgreSQL & Redis
docker compose -f infra/docker-compose.yml up -d postgres redis

# Run migrations
pnpm db:migrate

# Seed demo data
pnpm db:seed
```

### 3. Setup Environment Variables

```bash
cp .env.example .env
# แก้ไขค่าตามต้องการ
```

### 4. รัน Development Server

```bash
# รันทั้ง API และ Web
pnpm dev

# หรือรันแยก
pnpm --filter @essy/api dev    # API ที่ http://localhost:3001
pnpm --filter @essy/web dev    # Web ที่ http://localhost:3000
```

### 5. รันด้วย Docker Compose (Full Stack)

```bash
docker compose -f infra/docker-compose.yml up -d
```

## 🧪 Testing

```bash
# Unit tests (Vitest)
pnpm test

# E2E tests (Playwright)
pnpm test:e2e
```

## 📊 Database Schema

### Core Tables

- **User**: ผู้ใช้ (buyer/seller/admin)
- **SellerProfile**: โปรไฟล์ผู้ขาย (KYC, PromptPay, Reputation)
- **Deal**: รายการซื้อขาย
- **Payment**: การชำระเงิน
- **Dispute**: ข้อพิพาท
- **Evidence**: หลักฐานในข้อพิพาท
- **ReputationEvent**: เหตุการณ์ที่ส่งผลต่อ Reputation
- **DealEvent**: Audit trail ของ Deal

### Escrow State Machine

```
PENDING → HOLD → SHIPPED → RELEASED
   ↓         ↓        ↓
   └─────────┴────────┴→ DISPUTE → (REFUND | RELEASED)
```

Auto-release: ถ้า tracking แสดงว่า "จัดส่งสำเร็จ" หรือผู้ซื้อไม่ตอบสนอง 48 ชั่วโมง → RELEASED

## 🔌 API Endpoints

### Auth
- `POST /api/v1/auth/line/callback` - LINE OAuth callback
- `POST /api/v1/auth/email/request` - Request OTP
- `POST /api/v1/auth/email/verify` - Verify OTP
- `GET /api/v1/auth/me` - Get current user

### Seller
- `GET /api/v1/seller/me` - Get seller profile
- `POST /api/v1/seller/verify/basic` - Submit KYC
- `POST /api/v1/seller/verify/approve` - Admin approve KYC

### Deals
- `POST /api/v1/deals` - Create deal (seller)
- `GET /api/v1/deals/:id` - Get deal
- `POST /api/v1/deals/:id/ship` - Add tracking
- `POST /api/v1/deals/:id/confirm` - Buyer confirm receipt
- `POST /api/v1/deals/:id/cancel` - Cancel deal

### Payments
- `POST /api/v1/payments/create` - Create payment charge
- `POST /api/v1/payments/webhook/mock` - Mock webhook
- `POST /api/v1/payments/:dealId/refund` - Refund (admin)

### Disputes
- `POST /api/v1/disputes/:dealId/open` - Open dispute
- `POST /api/v1/disputes/:id/evidence` - Add evidence
- `POST /api/v1/disputes/:id/resolve` - Resolve dispute (admin)
- `GET /api/v1/disputes/:id` - Get dispute

### Admin
- `GET /api/v1/admin/deals` - List deals
- `GET /api/v1/admin/disputes` - List disputes
- `POST /api/v1/admin/deals/:id/release` - Force release

## 🎨 Frontend Pages

- `/` - Landing page
- `/pay/:token` - Paylink page (buyer)
- `/seller/dashboard` - Seller dashboard
- `/seller/deal/new` - Create new deal
- `/seller/kyc` - KYC verification
- `/buyer/deals` - Buyer deals list
- `/buyer/dispute/:id` - Open/view dispute
- `/admin/disputes` - Admin dispute management
- `/admin/deals` - Admin deal management

## 🔐 Security & Compliance (MVP Level)

- Role-based auth guards
- Input validation with Zod
- State transition validation
- File upload URLs (mock S3)
- Audit trail (DealEvent)
- **Note**: MVP uses mock payment provider only

## 📝 Seed Data

Demo users:
- `buyer@example.com` - ผู้ซื้อทดสอบ
- `seller@example.com` - ผู้ขายทดสอบ (Verified)
- `admin@example.com` - ผู้ดูแลระบบ

Demo deals:
- 3 deals ในสถานะต่างๆ (HOLD, SHIPPED, RELEASED)
- 1 open dispute พร้อมหลักฐาน

## 🚧 สิ่งที่ยังไม่ได้ทำ (Out of Scope สำหรับ MVP)

- Real PSP integration (Opn/Omise/Xendit/GB PrimePay)
- Real LINE OAuth (ใช้ mock)
- Real email OTP (ใช้ mock)
- Real file storage (ใช้ mock URLs)
- Real KYC verification (ใช้ mock)
- PSP licensing & compliance

## 🔄 Next Steps

1. **Integrate Real PSP**: แทนที่ MockPromptPayProvider ด้วย provider จริง
2. **Real LINE OAuth**: เชื่อมต่อ LINE Login API
3. **File Storage**: เชื่อมต่อ S3 หรือ Cloud Storage
4. **KYC Service**: เชื่อมต่อบริการยืนยันตัวตน
5. **Monitoring**: เพิ่ม logging และ monitoring
6. **Performance**: Optimize queries และ caching

## 📄 License

MIT

## 👥 Contributors

Built for Thailand Social-Commerce Escrow Platform MVP
