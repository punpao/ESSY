import Link from 'next/link';
import { Button } from '@essy/ui';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            ESSY
          </h1>
          <p className="text-2xl text-gray-700 mb-4">
            ระบบประกันการซื้อขายออนไลน์
          </p>
          <p className="text-xl text-gray-600 mb-8">
            โอนแล้วพักเงินจนกว่าคุณจะกดยืนยัน
          </p>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">ทำไมต้องใช้ ESSY?</h2>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div>
                <h3 className="font-semibold mb-2">🛡️ เงินยังไม่เข้าผู้ขาย</h3>
                <p className="text-gray-600">
                  จนกว่าคุณจะกดยืนยันรับของ หรือระบบเห็นว่า 'จัดส่งสำเร็จ' แล้ว
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">✅ ผู้ขายยืนยันตัวตน</h3>
                <p className="text-gray-600">
                  ผ่าน KYC และแสดง PromptPay ที่ตรงกับชื่อ
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">⚡ แก้ปัญหาเร็ว</h3>
                <p className="text-gray-600">
                  เปิดข้อพิพาทได้ทันที และทีมงานช่วยแก้ไขภายใน 24-72 ชั่วโมง
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Link href="/seller/dashboard">
              <Button size="lg">สำหรับผู้ขาย</Button>
            </Link>
            <Link href="/buyer/deals">
              <Button size="lg" variant="outline">สำหรับผู้ซื้อ</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
