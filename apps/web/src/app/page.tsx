import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <nav className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">ESSY</h1>
          <div className="flex gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">เข้าสู่ระบบ</Button>
            </Link>
            <Link href="/seller/dashboard">
              <Button>สำหรับผู้ขาย</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4 text-gray-900">
            โอนแล้วพักเงินจนกว่าคุณจะกดยืนยัน
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            ระบบพักเงินออนไลน์ที่ช่วยป้องกันการโกงในการซื้อขายออนไลน์
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/seller/dashboard">
              <Button size="lg">เริ่มขายสินค้า</Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline">
                เข้าสู่ระบบ
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <Card>
            <CardHeader>
              <CardTitle>🛡️ ปลอดภัย</CardTitle>
              <CardDescription>เงินยังไม่เข้าผู้ขาย จนกว่าคุณจะยืนยัน</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                ระบบจะพักเงินไว้จนกว่าคุณจะกดยืนยันรับของ หรือระบบเห็นว่า "จัดส่งสำเร็จ"
                แล้ว
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>⚡ รวดเร็ว</CardTitle>
              <CardDescription>ชำระเงินผ่าน PromptPay ได้ทันที</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                สแกน QR Code และชำระเงินผ่านแอปธนาคารของคุณได้เลย ไม่ต้องรอ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>✅ เชื่อถือได้</CardTitle>
              <CardDescription>ผู้ขายผ่านการยืนยันตัวตน</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                ผู้ขายที่ผ่านการยืนยันตัวตน (KYC) จะมีป้าย Verified Seller
                เพื่อความมั่นใจของคุณ
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-4">วิธีใช้งาน</h3>
          <div className="grid md:grid-cols-4 gap-4 mt-8">
            <div className="p-4">
              <div className="text-3xl mb-2">1️⃣</div>
              <p className="font-semibold">ผู้ขายสร้าง Paylink</p>
              <p className="text-sm text-gray-600">ส่งลิงก์ชำระเงินในแชท</p>
            </div>
            <div className="p-4">
              <div className="text-3xl mb-2">2️⃣</div>
              <p className="font-semibold">ผู้ซื้อชำระเงิน</p>
              <p className="text-sm text-gray-600">สแกน QR Code ผ่าน PromptPay</p>
            </div>
            <div className="p-4">
              <div className="text-3xl mb-2">3️⃣</div>
              <p className="font-semibold">ผู้ขายส่งของ</p>
              <p className="text-sm text-gray-600">เพิ่มหมายเลขพัสดุ</p>
            </div>
            <div className="p-4">
              <div className="text-3xl mb-2">4️⃣</div>
              <p className="font-semibold">ยืนยันรับของ</p>
              <p className="text-sm text-gray-600">เงินจะถูกโอนให้ผู้ขาย</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
