import Link from "next/link";
import { Button } from "@thai-escrow/ui";
import { Shield, Zap, CheckCircle } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">🛡️ Thai Escrow</div>
          <nav className="flex gap-4">
            <Link href="/seller/dashboard">
              <Button variant="ghost">ผู้ขาย</Button>
            </Link>
            <Link href="/buyer/deals">
              <Button variant="ghost">ผู้ซื้อ</Button>
            </Link>
            <Link href="/admin/disputes">
              <Button variant="ghost">Admin</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            โอนแล้วพักเงินจนกว่าคุณจะกดยืนยัน
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            แพลตฟอร์มพักเงินสำหรับการซื้อขายสินค้ามือสองบน Facebook, Instagram, LINE
            <br />
            <strong>ปลอดภัย รวดเร็ว โปร่งใส</strong> - เงินไม่เข้าผู้ขายจนกว่าคุณจะยืนยันว่าได้รับของแล้ว
          </p>

          <div className="flex gap-4 justify-center mb-12">
            <Link href="/seller/dashboard">
              <Button size="lg" className="text-lg px-8">
                เริ่มขายเลย
              </Button>
            </Link>
            <Link href="/buyer/deals">
              <Button size="lg" variant="outline" className="text-lg px-8">
                ดูรายการซื้อของฉัน
              </Button>
            </Link>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">พักเงินปลอดภัย</h3>
              <p className="text-gray-600">
                เงินจะถูกพักไว้จนกว่าผู้ซื้อจะยืนยันว่าได้รับสินค้าแล้ว
                หรือระบบจะปล่อยเงินอัตโนมัติหลัง 48 ชั่วโมง
              </p>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md">
              <Zap className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">จ่ายผ่าน PromptPay</h3>
              <p className="text-gray-600">
                สแกน QR Code จ่ายเงินผ่าน PromptPay ได้ทันที ไม่ต้องสมัครบัตรเครดิต
                รองรับทุกธนาคารในไทย
              </p>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md">
              <CheckCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Verified Seller</h3>
              <p className="text-gray-600">
                ผู้ขายต้องยืนยันตัวตนผ่าน KYC และ PromptPay
                พร้อมระบบ Reputation และจัดการข้อพิพาทภาษาไทย
              </p>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-16 bg-blue-50 rounded-xl p-8">
            <h2 className="text-3xl font-bold mb-8">วิธีการใช้งาน</h2>
            <div className="grid md:grid-cols-4 gap-6 text-left">
              <div>
                <div className="text-2xl font-bold text-blue-600 mb-2">1</div>
                <h4 className="font-semibold mb-1">ผู้ขายสร้าง Paylink</h4>
                <p className="text-sm text-gray-600">แชร์ลิงก์ให้ผู้ซื้อในแชท</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 mb-2">2</div>
                <h4 className="font-semibold mb-1">ผู้ซื้อจ่ายเงิน</h4>
                <p className="text-sm text-gray-600">สแกน QR PromptPay เงินจะถูกพัก</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 mb-2">3</div>
                <h4 className="font-semibold mb-1">ผู้ขายส่งของ</h4>
                <p className="text-sm text-gray-600">ใส่เลขพัสดุ ระบบติดตาม</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 mb-2">4</div>
                <h4 className="font-semibold mb-1">ปล่อยเงิน</h4>
                <p className="text-sm text-gray-600">ผู้ซื้อยืนยัน หรือออโต้ปล่อยเงิน</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 text-sm text-gray-500">
            มีปัญหา? เปิด Dispute ได้ตลอด • ทีมงานช่วยแก้ไขภายใน 24-72 ชั่วโมง
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 text-center text-gray-600">
        <p>© 2025 Thai Escrow Platform - MVP Demo</p>
        <p className="text-sm mt-2">
          This is a demo with mock payments. Not for production use.
        </p>
      </footer>
    </div>
  );
}
