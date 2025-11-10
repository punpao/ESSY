import { Button, Card, CardContent, CardHeader, CardTitle } from "@escrow/ui";
import Link from "next/link";

const steps = [
  {
    title: "1. สร้าง Paylink ในแชท",
    description: "ผู้ขายกรอกรายการสินค้า ใส่ราคา และส่งลิงก์ให้ผู้ซื้อได้ทันที"
  },
  {
    title: "2. ผู้ซื้อสแกน PromptPay",
    description: "ระบบพักเงินไว้ใน Escrow จนกว่าจะยืนยันรับของ หรือส่งสำเร็จ 48 ชั่วโมง"
  },
  {
    title: "3. ปล่อยเงิน/คืนเงินไว",
    description:
      "กดยืนยันรับของเพื่อโอนให้ผู้ขาย หรือเปิดข้อพิพาทให้ทีมงานช่วยตัดสิน"
  }
];

export default function LandingPage() {
  return (
    <div className="space-y-12">
      <section className="rounded-3xl bg-gradient-to-r from-sky-500 to-emerald-400 p-10 text-white shadow-lg">
        <h1 className="text-3xl font-bold">
          โอนแล้วพักเงินจนกว่าคุณจะกดยืนยัน — ปลอดภัยสำหรับการซื้อขายในโซเชียล
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-sky-50">
          ป้องกันการโกงที่เจอบ่อยใน Facebook, Instagram, LINE ด้วย Escrow ที่ออกแบบเพื่อคนไทย
          รองรับ PromptPay เป็นอันดับแรก พร้อมระบบข้อพิพาทที่ตอบสนองในไม่กี่ชั่วโมง
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/seller/dashboard">
            <Button>เริ่มต้นสำหรับผู้ขาย</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary">เข้าสู่ระบบ / สมัคร</Button>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-slate-900">ทำงานอย่างไร</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <Card key={step.title} className="h-full">
              <CardHeader>
                <CardTitle>{step.title}</CardTitle>
              </CardHeader>
              <CardContent>{step.description}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">
          ทำไมดีกว่าโอนตรงหรือ PayPal
        </h3>
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          <li>• PromptPay-first พร้อมสลิปดิจิทัลที่ตรวจสอบได้</li>
          <li>• UI ภาษาไทยทั้งหมด เข้าใจง่ายทั้งผู้ซื้อและผู้ขาย</li>
          <li>• ทีมงานไทยตรวจสอบข้อพิพาทภายใน 24-72 ชั่วโมง</li>
          <li>• ระบบคะแนนความน่าเชื่อถือของผู้ขาย อัปเดตทุกดีล</li>
        </ul>
      </section>
    </div>
  );
}
