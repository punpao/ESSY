import Link from 'next/link';
import { Button, Card, CardDescription, CardHeader, CardTitle } from '@thai-escrow/ui';

const features = [
  {
    title: 'PromptPay-first Escrow',
    desc: 'พักเงินทันทีหลังโอนผ่าน PromptPay QR ลดความเสี่ยงจากการโกงโอนแล้วหาย',
  },
  {
    title: 'ลิงก์จ่ายในแชท',
    desc: 'สร้าง Paylink ส่งในแชท Facebook / LINE ลูกค้าสแกนจ่ายได้เลย',
  },
  {
    title: 'แก้ปัญหารวดเร็ว',
    desc: 'หากมีปัญหาเปิดข้อพิพาท ทีมงานชาวไทยตัดสินใน 24-72 ชั่วโมง',
  },
];

export default function LandingPage() {
  return (
    <div className="space-y-12">
      <section className="grid gap-8 md:grid-cols-2 md:items-center">
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-slate-900">
            โอนแล้วพักเงิน จนกว่าคุณจะกดยืนยันรับของ
          </h1>
          <p className="text-lg text-slate-600">
            Social commerce ในไทยไม่ต้องเสี่ยงอีกต่อไป ระบบ Escrow ที่ออกแบบสำหรับผู้ซื้อและผู้ขายใน Facebook / IG / LINE พร้อม PromptPay, ที่อยู่ภาษาไทย, และข้อพิพาทที่ตัดสินเร็ว
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/seller/deal/new">เริ่มสร้าง Paylink</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/pay/demo">ดูตัวอย่างหน้าชำระเงิน</Link>
            </Button>
          </div>
          <p className="text-sm text-emerald-700">
            “เงินยังไม่เข้าผู้ขาย จนกว่าคุณจะกดยืนยันรับของ หรือระบบเห็นว่า ‘จัดส่งสำเร็จ’ แล้ว”
          </p>
        </div>
        <Card className="p-6">
          <CardHeader>
            <CardTitle>ขั้นตอนการทำงาน</CardTitle>
            <CardDescription>
              ผู้ขายสร้าง Paylink → ผู้ซื้อสแกน PromptPay → ระบบพักเงิน → ผู้ขายส่งของ → ผู้ซื้อกดยืนยัน → โอนเงิน
            </CardDescription>
          </CardHeader>
          <ol className="space-y-3 text-sm text-slate-700">
            <li>1. ผู้ขายสร้าง Invoice พร้อม PromptPay</li>
            <li>2. ผู้ซื้อสแกน QR แล้วอัปโหลดสลิป (จำลอง)</li>
            <li>3. ระบบพักเงินสถานะ HOLD</li>
            <li>4. ผู้ขายใส่เลขพัสดุ</li>
            <li>5. เมื่อส่งถึงหรือครบ 48 ชม. → โอนให้ผู้ขาย</li>
            <li>6. ถ้ามีปัญหา → เปิดข้อพิพาท ทีมงานชี้ขาดคืนเงินหรือโอน</li>
          </ol>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="p-6">
            <CardTitle className="mb-2 text-lg">{feature.title}</CardTitle>
            <p className="text-sm text-slate-600">{feature.desc}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
