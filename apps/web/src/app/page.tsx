import Link from 'next/link';
import { Button } from '@essy/ui';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            ESSY - Escrow สำหรับการซื้อขายออนไลน์
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            โอนแล้วพักเงินจนกว่าคุณจะกดยืนยันรับของ หรือระบบเห็นว่า
            &quot;จัดส่งสำเร็จ&quot; แล้ว
          </p>
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">ทำไมต้องใช้ ESSY?</h2>
            <ul className="text-left space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>
                  <strong>PromptPay-first:</strong> ชำระเงินผ่าน QR Code
                  PromptPay ได้ทันที
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>
                  <strong>เงินปลอดภัย:</strong> เงินยังไม่เข้าผู้ขาย
                  จนกว่าคุณจะกดยืนยันรับของ
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>
                  <strong>Verified Seller:</strong> ผู้ขายผ่านการยืนยันตัวตน
                  (KYC)
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>
                  <strong>ระบบแก้ไขปัญหา:</strong> เปิด Dispute
                  ได้เมื่อมีปัญหา พร้อมทีมดูแล
                </span>
              </li>
            </ul>
          </div>
          <div className="flex gap-4 justify-center">
            <Link href="/seller/dashboard">
              <Button size="lg">สำหรับผู้ขาย</Button>
            </Link>
            <Link href="/buyer/deals">
              <Button size="lg" variant="outline">
                สำหรับผู้ซื้อ
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
