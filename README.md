# PromptHold – Thailand Social Commerce Escrow MVP

PromptHold เป็นแพลตฟอร์มเอสโครว์ที่ออกแบบมาเพื่อปิดช่องโหว่การซื้อขายของมือสองในโซเชียลไทย (LINE / Facebook / Instagram) โดยพักเงินไว้ผ่าน PromptPay จนกว่าผู้ซื้อจะยืนยันรับสินค้า หรือทีมดูแลข้อพิพาทจะตัดสินใจ

## คุณสมบัติหลัก
- PromptPay-first escrow พร้อมลิงก์ชำระเงินแบบ Social Paylink
- รองรับ LINE Login และอีเมล OTP (mock) พร้อมสิทธิ์ตามบทบาท buyer/seller/admin
- หน้าจอไทยครบทั้งผู้ซื้อ ผู้ขาย และทีมดูแลข้อพิพาท
- ระบบข้อพิพาท + หลักฐาน + SLA 24–72 ชม. พร้อมเวิร์คโฟลว์ REFUND/RELEASE
- State machine ครอบคลุม PENDING → HOLD → SHIPPED → RELEASED และ DISPUTE สู่ REFUND
- Auto-release ภายใน 48 ชม. หลังจัดส่ง (BullMQ worker + Redis)
- Seller reputation (sigmoid) และ Verified Seller badge

## โครงสร้างโปรเจกต์
```
apps/
  api/         Fastify + Prisma REST API
  web/         Next.js 14 (App Router) UI
packages/
  core/        State machine, shared types
  payment/     PaymentProvider interface + Mock PromptPay
  ui/          Reusable shadcn-inspired components
infra/
  docker-compose.yml
tests/
  e2e/         Playwright end-to-end specs
```

## การติดตั้ง
```bash
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```
- API: `http://localhost:4000`
- Web: `http://localhost:3000`

### Docker Compose
```bash
cd infra
docker compose up -d --build
```
Compose จะสตาร์ท Postgres, Redis, API และ Web ให้พร้อม

### คำสั่งที่ใช้บ่อย
```bash
pnpm test            # Vitest (state machine + validation)
pnpm test:e2e        # Playwright flows (ต้องมีบริการรันอยู่)
pnpm db:migrate      # Prisma migrate deploy
pnpm db:seed         # Seed ผู้ใช้/ดีล/ข้อพิพาทตัวอย่าง
```

## เดโฟลว์ (ใส่ภาพหน้าจอภายหลัง)
1. ผู้ขาย (Verified) สร้าง Paylink ในแดชบอร์ด → แชร์ลิงก์ให้ผู้ซื้อในแชท
2. ผู้ซื้อเปิด `/pay/:token` → สแกน PromptPay → เงินเข้าสถานะ HOLD
3. ผู้ขายกรอกเลขพัสดุ → ลูกค้ากดยืนยัน → ระบบ RELEASE เงินให้ผู้ขาย
4. หากมีปัญหา ลูกค้าเปิดข้อพิพาท (ของยังไม่ถึง / ของไม่ตรงปก / อื่น ๆ) → ทีมดูแลกด REFUND หรือ RELEASE

## ข้อสังเกตด้านความปลอดภัย
- ใช้ JWT และ role guard บนทุก endpoint ที่สำคัญ
- ตรวจสอบ input ด้วย Zod
- เก็บประวัติ state change ใน `DealEvent`
- Provider ชำระเงินยังเป็น mock: ไม่มีธุรกรรมเงินจริง

## Roadmap สู่โปรดักชัน
- ต่อเชื่อม PSP ไทยจริง (Opn/Omise, Xendit, GB PrimePay) ผ่าน `PaymentProvider`
- เพิ่มระบบส่ง OTP จริง / LINE callback & webhook verification
- ทำให้ KYC ครบวงจร (อัปโหลดเอกสาร, ตรวจจับการปลอม, workflow อนุมัติ)
- เพิ่ม SLA dashboard, แจ้งเตือน และระบบมอนิเตอร์/ออดิต

> ⚠️ MVP นี้เป็น mock environment ห้ามเชื่อมต่อกับเงินจริงจนกว่าจะผ่านการทดสอบและได้รับใบอนุญาตที่เกี่ยวข้อง
