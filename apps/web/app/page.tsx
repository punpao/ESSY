import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@escrow/ui";
import { Button } from "@escrow/ui";

const steps = [
  {
    title: "สร้าง Paylink ในแชท",
    description: "ผู้ขายสร้างลิงก์รับเงิน พร้อมรายละเอียดสินค้า และราคาบาท."
  },
  {
    title: "ผู้ซื้อสแกน PromptPay",
    description:
      "เงินถูกพักไว้ทันที ระบุชัดว่า “ยังไม่โอนให้ผู้ขายจนกว่าจะยืนยันรับของ”."
  },
  {
    title: "จัดส่ง + ยืนยัน",
    description:
      "ระบบติดตามหมายเลขพัสดุ อัปเดตสถานะอัตโนมัติ ปล่อยเงินเมื่อของถึงมือ."
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 pb-20">
      <section className="mx-auto mt-16 max-w-4xl text-center">
        <span className="rounded-full bg-brand/10 px-4 py-1 text-xs font-semibold text-brand">
          Social Commerce Escrow สำหรับคนไทย
        </span>
        <h1 className="mt-6 text-4xl font-bold text-slate-900 sm:text-5xl">
          โอนแล้วพักเงิน จนกว่าคุณจะกดยืนยันรับของ
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          เชื่อมประสบการณ์ซื้อ-ขายมือสองบน Facebook / IG / LINE
          ด้วย PromptPay Escrow ที่ออกแบบให้เข้าใจภาษาไทย และข้อพิพาทแก้ได้ไว
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/seller/deal/new">เริ่มสร้าง Paylink ทันที</Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <a href="#how-it-works">ดูวิธีใช้งาน</a>
          </Button>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          เงินยังไม่เข้าผู้ขาย จนกว่าคุณจะกดยืนยันรับของ หรือระบบเห็นว่า “จัดส่งสำเร็จ” แล้ว
        </p>
      </section>

      <section
        id="how-it-works"
        className="mx-auto mt-20 grid max-w-5xl gap-6 sm:grid-cols-3"
      >
        {steps.map((step) => (
          <Card key={step.title}>
            <CardHeader>
              <CardTitle>{step.title}</CardTitle>
              <CardDescription>{step.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="mx-auto mt-24 max-w-5xl rounded-3xl bg-white p-10 shadow-xl">
        <h2 className="text-2xl font-semibold text-slate-900">
          PromptPay-first. พัฒนามาเพื่อการซื้อขายผ่านแชทจริง ๆ
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>ฝั่งผู้ซื้อ</CardTitle>
              <CardDescription>
                สแกน QR ผ่านธนาคารที่ใช้อยู่ได้เลย ระบบย้ำชัดเจนว่าเงินยังไม่ถึงมือผู้ขาย
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <p>• ติดตามสถานะจัดส่ง และยืนยันรับของได้ในหน้ารวม</p>
              <p>• เปิดข้อพิพาทเป็นภาษาไทย เลือกเหตุผล: ของยังไม่ถึง / ไม่ตรงปก / อื่น ๆ</p>
              <p>• ทีมงานไทยดูแลเคสภายใน 24–72 ชม.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>ฝั่งผู้ขาย</CardTitle>
              <CardDescription>
                บริหารดีลได้ที่เดียว เช็ก PromptPay ว่าตรงกับชื่อจริง กดอัปเดต tracking ได้ทันที
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <p>• Verified Seller + Reputation score จากการส่งของสำเร็จ</p>
              <p>• เงินถูกปล่อยอัตโนมัติเมื่อจัดส่งสำเร็จ 48 ชม. หรือเมื่อลูกค้ากดยืนยัน</p>
              <p>• ข้อพิพาทแก้ได้เร็ว ไม่ต้องคุยกับต่างประเทศ</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
