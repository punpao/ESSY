import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            ESSY
          </h1>
          <p className="text-2xl text-gray-700 mb-8">
            ระบบ Escrow สำหรับการซื้อขายออนไลน์
          </p>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            โอนแล้วพักเงินจนกว่าคุณจะกดยืนยันรับของ หรือระบบเห็นว่า 'จัดส่งสำเร็จ' แล้ว
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/pay/demo">
              <Button size="lg">ทดลองใช้</Button>
            </Link>
            <Link href="/seller/dashboard">
              <Button size="lg" variant="outline">สำหรับผู้ขาย</Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <Card>
            <CardHeader>
              <CardTitle>🛡️ ปลอดภัย</CardTitle>
              <CardDescription>
                เงินถูกพักไว้ในระบบ จนกว่าคุณจะยืนยันรับของ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                ไม่ต้องกังวลเรื่องการถูกโกง เงินจะไม่เข้าผู้ขายจนกว่าคุณจะกดยืนยัน
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>⚡ รวดเร็ว</CardTitle>
              <CardDescription>
                ชำระผ่าน PromptPay QR Code ทันที
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                สแกน QR Code และโอนเงินได้ทันที ไม่ต้องรอ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>✅ ยืนยันตัวตน</CardTitle>
              <CardDescription>
                ผู้ขายผ่านการยืนยันตัวตน (KYC)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                ผู้ขายที่ผ่านการตรวจสอบจะแสดงป้าย Verified Seller
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold mb-8">วิธีการใช้งาน</h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="p-6 bg-white rounded-lg shadow">
              <div className="text-4xl mb-4">1️⃣</div>
              <h3 className="font-semibold mb-2">ผู้ขายสร้าง Paylink</h3>
              <p className="text-sm text-gray-600">ส่งลิงก์ชำระเงินในแชท</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow">
              <div className="text-4xl mb-4">2️⃣</div>
              <h3 className="font-semibold mb-2">ผู้ซื้อชำระเงิน</h3>
              <p className="text-sm text-gray-600">สแกน QR Code และโอนเงิน</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow">
              <div className="text-4xl mb-4">3️⃣</div>
              <h3 className="font-semibold mb-2">ผู้ขายจัดส่ง</h3>
              <p className="text-sm text-gray-600">เพิ่มหมายเลขพัสดุ</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow">
              <div className="text-4xl mb-4">4️⃣</div>
              <h3 className="font-semibold mb-2">ยืนยันรับของ</h3>
              <p className="text-sm text-gray-600">เงินเข้าผู้ขายทันที</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
