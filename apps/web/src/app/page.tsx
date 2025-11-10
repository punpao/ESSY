import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            ESSY
          </h1>
          <p className="text-2xl text-gray-700 mb-8">
            ระบบพักเงินสำหรับการซื้อขายออนไลน์
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            <strong>โอนแล้วพักเงินจนกว่าคุณจะกดยืนยัน</strong>
            <br />
            หรือระบบเห็นว่า &apos;จัดส่งสำเร็จ&apos; แล้ว
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/seller/dashboard">
              <Button size="lg">สำหรับผู้ขาย</Button>
            </Link>
            <Link href="/buyer/deals">
              <Button size="lg" variant="outline">สำหรับผู้ซื้อ</Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>🛡️ ปลอดภัย</CardTitle>
              <CardDescription>
                เงินยังไม่เข้าผู้ขาย จนกว่าคุณจะกดยืนยันรับของ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                ระบบพักเงินอัตโนมัติ รับรองความปลอดภัยในการซื้อขาย
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
                ไม่ต้องรออนุมัติ โอนเงินได้ทันทีเมื่อยืนยันรับของ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>✅ น่าเชื่อถือ</CardTitle>
              <CardDescription>
                ผู้ขายผ่านการยืนยันตัวตน (KYC)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                ระบบ Reputation และ Verified Seller Badge
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">วิธีใช้งาน</h2>
          <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4">
              <div className="text-2xl font-bold text-blue-600 mb-2">1</div>
              <p className="font-semibold">ผู้ขายสร้าง Paylink</p>
              <p className="text-sm text-gray-600">ส่งลิงก์ในแชท</p>
            </div>
            <div className="p-4">
              <div className="text-2xl font-bold text-blue-600 mb-2">2</div>
              <p className="font-semibold">ผู้ซื้อชำระเงิน</p>
              <p className="text-sm text-gray-600">สแกน QR PromptPay</p>
            </div>
            <div className="p-4">
              <div className="text-2xl font-bold text-blue-600 mb-2">3</div>
              <p className="font-semibold">ผู้ขายเพิ่มเลขพัสดุ</p>
              <p className="text-sm text-gray-600">ระบบอัปเดตสถานะ</p>
            </div>
            <div className="p-4">
              <div className="text-2xl font-bold text-blue-600 mb-2">4</div>
              <p className="font-semibold">ยืนยันรับของ</p>
              <p className="text-sm text-gray-600">เงินโอนให้ผู้ขาย</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
