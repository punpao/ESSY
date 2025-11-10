import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@thai-escrow/ui';

export default function PayDemoPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">เดโม่หน้า Paylink</h1>
      <Card className="p-6">
        <CardHeader>
          <CardTitle>ทดลอง</CardTitle>
          <CardDescription>
            หลังรัน seed แล้วจะมีดีลในสถานะ PENDING ใช้ paylink ที่สร้างหรือดูในฐานข้อมูล
          </CardDescription>
        </CardHeader>
        <p className="text-sm text-slate-600">
          เพื่อทดสอบครบ flow: ผู้ขายเข้าสู่ระบบ → สร้าง Paylink → ส่งลิงก์นี้ให้ผู้ซื้อ → ผู้ซื้อเข้าสู่ระบบแล้วเปิดลิงก์ดังกล่าว
        </p>
        <p className="mt-3 text-sm text-emerald-600">
          ในการดีพลอยจริงให้ฝัง QR จริงจากผู้ให้บริการ PromptPay ที่ผ่านการตรวจสอบ
        </p>
        <Link href="/seller/deal/new" className="mt-4 inline-block text-sm text-emerald-600">
          ไปสร้าง Paylink ตอนนี้
        </Link>
      </Card>
    </div>
  );
}
