import { Card, CardContent, CardHeader, Button, Badge } from '@thai-social-escrow/ui';

const features = [
  {
    title: 'โอนแล้วพักเงิน',
    description: 'เงินคงอยู่ใน PromptHold จนกว่าคุณจะกดยืนยันรับสินค้า หรือระบบยืนยันการจัดส่งสำเร็จ',
    tone: 'HOLD'
  },
  {
    title: 'เพย์ลิงก์ในแชท',
    description: 'สร้าง Paylink ใน LINE / IG / Facebook Messenger ได้ในคลิกเดียว พร้อมคิวอาร์ PromptPay',
    tone: 'PENDING'
  },
  {
    title: 'ทีมดูแลข้อพิพาทในไทย',
    description: 'หากมีปัญหาเปิดข้อพิพาทเป็นภาษาไทยและทีมจะช่วยตัดสินใจภายใน 24-72 ชั่วโมง',
    tone: 'DISPUTE'
  }
];

export default function LandingPage() {
  return (
    <section className="space-y-12">
      <div className="rounded-3xl bg-emerald-600 px-8 py-12 text-white shadow-lg">
        <h1 className="text-3xl font-semibold lg:text-4xl">โอนแล้วพักเงินจนกว่าคุณจะกดยืนยัน</h1>
        <p className="mt-4 max-w-2xl text-lg text-emerald-50">
          PromptHold ช่วยปิดจ๊อบ Social Commerce ให้ปลอดภัย รองรับ PromptPay-first escrow, เพย์ลิงก์ในแชท และทีมดูแลข้อพิพาทในไทย
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <a href="/seller/deal/new">เริ่มสร้าง Paylink</a>
          </Button>
          <Button variant="secondary" asChild>
            <a href="/buyer/deals">ติดตามคำสั่งซื้อ</a>
          </Button>
        </div>
        <p className="mt-6 text-sm text-emerald-100">
          เงินยังไม่เข้าผู้ขาย จนกว่าคุณจะกดยืนยันรับของ หรือระบบเห็นว่า ‘จัดส่งสำเร็จ’ แล้ว
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <Badge tone={feature.tone}>{feature.tone}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
