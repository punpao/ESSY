import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Zap, CheckCircle, UserCheck } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="text-2xl font-bold text-blue-600">Thai Escrow</div>
          <div className="space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost">เข้าสู่ระบบ</Button>
            </Link>
            <Link href="/seller/dashboard">
              <Button>เริ่มขาย</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          ซื้อขายปลอดภัย<br />ด้วยระบบพักเงิน
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          โอนแล้วพักเงินจนกว่าคุณจะกดยืนยัน<br />
          ลดความเสี่ยงการโกงในการซื้อขายผ่าน Facebook, Instagram, LINE
        </p>
        <div className="space-x-4">
          <Link href="/seller/dashboard">
            <Button size="lg" className="text-lg px-8">
              สร้าง Paylink ฟรี
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button size="lg" variant="outline" className="text-lg px-8">
              วิธีการใช้งาน
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <Shield className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>พักเงินปลอดภัย</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                เงินไม่เข้าผู้ขายทันที จนกว่าผู้ซื้อจะกดยืนยันรับของ
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>PromptPay QR</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                ชำระผ่าน QR Code ง่ายๆ รองรับทุกธนาคารในไทย
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <UserCheck className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Verified Seller</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                ระบบยืนยันตัวตนผู้ขาย + คะแนนความน่าเชื่อถือ
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>ระงับข้อพิพาท</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                ทีมงานช่วยไกล่เกลี่ยภายใน 24-72 ชั่วโมง
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="container mx-auto px-4 py-16 bg-gray-50 rounded-lg my-16">
        <h2 className="text-3xl font-bold text-center mb-12">วิธีการใช้งาน</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="font-semibold text-lg mb-2">ผู้ขายสร้าง Paylink</h3>
            <p className="text-gray-600">ใส่ชื่อสินค้า ราคา แล้วแชร์ลิงก์ไปให้ผู้ซื้อ</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="font-semibold text-lg mb-2">ผู้ซื้อจ่ายผ่าน QR</h3>
            <p className="text-gray-600">สแกน QR ชำระเงิน ระบบพักเงินไว้</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="font-semibold text-lg mb-2">กดยืนยันรับของ</h3>
            <p className="text-gray-600">ผู้ซื้อกดยืนยัน เงินโอนให้ผู้ขายทันที</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-6">เริ่มใช้งานวันนี้</h2>
        <p className="text-xl text-gray-600 mb-8">ไม่มีค่าสมัคร · ไม่มีค่าธรรมเนียมรายเดือน</p>
        <Link href="/seller/dashboard">
          <Button size="lg" className="text-lg px-8">
            สร้าง Paylink เลย
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2024 Thai Escrow Platform · MVP Demo</p>
        </div>
      </footer>
    </div>
  )
}
