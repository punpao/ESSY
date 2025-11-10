import Link from 'next/link';
import { Button, Card, CardBody, CardHeader } from '@thai-escrow/ui';

const features = [
  {
    title: 'PromptPay-first Escrow',
    description:
      'สร้างเพย์ลิงก์แล้วให้ลูกค้าสแกน QR โอนเข้าบัญชีพักเงิน ตรวจสอบสถานะได้ทันที'
  },
  {
    title: 'จัดการข้อพิพาทแบบไทย ๆ',
    description:
      'เปิดข้อพิพาทผ่าน UI ภาษาไทย ทีมงานตอบกลับภายใน 24 ชม. พร้อมหลักฐานแชท/รูป'
  },
  {
    title: 'ผู้ขายยืนยันตัวจริง',
    description:
      'KYC ด้วย PromptPay + เซลฟี่ แสดงป้าย Verified Seller และคะแนนความน่าเชื่อถือ'
  }
];

export default function LandingPage() {
  return (
    <main className="bg-gradient-to-b from-blue-50 via-white to-white">
      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 text-center">
        <span className="mx-auto inline-flex rounded-full bg-blue-100 px-4 py-1 text-sm text-blue-700">
          โอนแล้วพักเงิน จนกว่าคุณจะกดยืนยันรับของ
        </span>
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">
          ปลอดภัยทั้งผู้ซื้อและผู้ขายบนโซเชียล ด้วยเอสโครว์ที่ออกแบบเพื่อคนไทย
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-600">
          SocialTrust Escrow รวม PromptPay, แชทเพย์ลิงก์, ระบบติดตามพัสดุ และข้อพิพาทเร็วในที่เดียว
          ลดการโกงมือสองบน Facebook / Instagram / LINE
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/login">
            <Button>เริ่มใช้งานสำหรับผู้ขาย</Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost">ดูดีลของฉัน</Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-24 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader title={feature.title} />
            <CardBody>
              <p className="text-sm text-slate-600">{feature.description}</p>
            </CardBody>
          </Card>
        ))}
      </section>
    </main>
  );
}
