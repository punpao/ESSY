# โอนพัก (Thai Social Commerce Escrow) – MVP

แพลตฟอร์ม Escrow สำหรับผู้ซื้อ-ผู้ขายของมือสองในไทย เน้น PromptPay, การส่งลิงก์ชำระในแชท, UX ภาษาไทย และทีมงานตัดสินข้อพิพาทในประเทศ

## ฟีเจอร์หลัก
- Paylink พร้อม PromptPay QR (Mock) พักเงินอัตโนมัติเมื่อผู้ซื้อชำระ
- สถานะดีลครบวงจร: `PENDING → HOLD → SHIPPED → RELEASED`, แตก branch เป็น `DISPUTE → REFUND`
- การยืนยันผู้ขาย (PromptPay + selfie), badge Verified Seller, คะแนนความน่าเชื่อถือ
- เปิดข้อพิพาทพร้อมหลักฐาน, ทีมงานสามารถ REFUND/RELEASE ได้เร็ว
- Worker BullMQ เช็ก auto-release ทุก 15 นาที และ recalculation reputation
- LINE Login (mock) และ Email OTP (Magic Link) ผ่าน API Fastify
- Next.js 14 App Router พร้อมหน้า Thai-first สำหรับผู้ขาย/ผู้ซื้อ/แอดมิน

## โครงสร้าง Monorepo
```
apps/
  api/      # Fastify + Prisma + BullMQ
  web/      # Next.js 14, Tailwind, shadcn/ui
packages/
  core/     # State machine, validation (Zod)
  ui/       # Shared UI components
  payment/  # PaymentProvider interface + Mock PromptPay
infra/
  docker-compose.yml
  prisma/schema.prisma (migrations under infra/prisma)
```

## การติดตั้ง
```bash
pnpm install
pnpm db:migrate
pnpm db:seed
```

### รันแบบ Local Dev
เปิดบริการพร้อมกันผ่าน Turbo:
```bash
pnpm dev
```
- API: http://localhost:4000
- Web: http://localhost:3000

### Docker Compose
```bash
cd infra
docker compose up -d
```
จะเปิด Postgres, Redis, API และ Web (ใช้ `.env.example` ในโหมด dev)

## สคริปต์สำคัญ
- `pnpm db:migrate` – ใช้ Prisma migrate deploy (schema อยู่ใน `infra/prisma`)
- `pnpm db:seed` – เติม demo users/deals/disputes
- `pnpm test` – Vitest (state machine + validation)
- `pnpm test:e2e` – Playwright (flow ครบ: paylink → hold → release → dispute-refund)

## Seed Data ที่พร้อมใช้งาน
- ผู้ซื้อ: `buyer@escrow.local`
- ผู้ขาย: `seller@escrow.local`
- แอดมิน: `ops@escrow.local`
ทุกบัญชีใช้ Email OTP (endpoint จะคืน `debugCode` สำหรับ dev)

## เดโม่ Flow ที่แนะนำ
1. ผู้ขายล๊อกอิน → `/seller/deal/new` → สร้าง Paylink
2. ผู้ซื้อเปิดลิงก์ `/pay/[token]` → สร้าง PromptPay QR → จำลอง webhook → สถานะ HOLD
3. ผู้ขายอัปเดตเลขพัสดุ + แจ้งส่งถึง → Auto release เช่น buyer กดยืนยันบน `/deal/[id]`
4. Buyer เปิด dispute → Admin ตัดสิน REFUND/RELEASE จาก `/admin/disputes`

## สิ่งที่ยังไม่ทำ (ถัดไป)
- เชื่อมต่อ PSP จริง (Opn/Omise, Xendit, GB PrimePay)
- ระบบไฟล์อัปโหลดจริง (ปัจจุบันเก็บ URL Mock)
- Production-grade auth (NextAuth, webhook signature ที่แข็งแรง)
- SLA dashboard และ analytics เพิ่มเติม
