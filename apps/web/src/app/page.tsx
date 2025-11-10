import Link from 'next/link';
import { Shield, Clock, CheckCircle2, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">SafePay Thailand</h1>
          </div>
          <nav className="space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost">เข้าสู่ระบบ</Button>
            </Link>
            <Link href="/auth/login">
              <Button>เริ่มต้นใช้งาน</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-6">
            ซื้อขายปลอดภัย<br />
            เงินพักไว้จนกว่าจะยืนยันรับของ
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            แพลตฟอร์มพักเงินสำหรับการซื้อขายบน Facebook, Instagram, LINE
            <br />
            โอนเงินแล้วเราพักไว้ให้ จนกว่าคุณจะได้รับสินค้าและยืนยัน
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/auth/login">
              <Button size="lg" className="text-lg px-8">
                เริ่มต้นใช้งานฟรี
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="text-lg px-8">
                วิธีการใช้งาน
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20" id="features">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">
            ทำไมต้อง SafePay?
          </h3>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h4 className="text-xl font-semibold mb-2">ปลอดภัย 100%</h4>
              <p className="text-muted-foreground">
                เงินพักไว้กับเราจนกว่าคุณจะยืนยันรับสินค้า ไม่มีเงินหาย
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">โอนผ่าน PromptPay</h4>
              <p className="text-muted-foreground">
                สแกน QR โอนเงินง่าย ได้เงินเร็ว ไม่ต้องรอนาน
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">ระบบพิจารณาข้อพิพาท</h4>
              <p className="text-muted-foreground">
                ของไม่ตรงปก? เปิดข้อพิพาทได้ทันที ทีมงานดูแล 24-72 ชม.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-orange-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">ร้านค้ายืนยันตัวตน</h4>
              <p className="text-muted-foreground">
                ระบบ KYC สำหรับร้านค้า ดูคะแนนความน่าเชื่อถือได้
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-50" id="how-it-works">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">
            วิธีการใช้งาน (ง่ายมาก!)
          </h3>
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-start space-x-4">
              <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-xl font-bold">
                1
              </div>
              <div>
                <h4 className="text-xl font-semibold mb-2">
                  ผู้ขายส่งลิงก์ชำระเงินในแชท
                </h4>
                <p className="text-muted-foreground">
                  ร้านค้าสร้างลิงก์ชำระเงินผ่านระบบ แล้วส่งให้คุณใน LINE, Facebook หรือ Instagram
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-xl font-bold">
                2
              </div>
              <div>
                <h4 className="text-xl font-semibold mb-2">
                  คุณโอนเงินผ่าน PromptPay QR
                </h4>
                <p className="text-muted-foreground">
                  คลิกลิงก์ → สแกน QR Code → โอนผ่าน PromptPay
                  <br />
                  <strong className="text-primary">
                    เงินจะพักไว้กับเรา ยังไม่โอนให้ผู้ขาย
                  </strong>
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-xl font-bold">
                3
              </div>
              <div>
                <h4 className="text-xl font-semibold mb-2">
                  ผู้ขายส่งของ + ใส่เลขพัสดุ
                </h4>
                <p className="text-muted-foreground">
                  ร้านค้าส่งของและใส่เลขพัสดุในระบบ คุณติดตามสถานะได้ตลอด
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-xl font-bold">
                4
              </div>
              <div>
                <h4 className="text-xl font-semibold mb-2">
                  ได้รับของแล้ว กดยืนยัน → เงินโอนให้ผู้ขาย
                </h4>
                <p className="text-muted-foreground">
                  เมื่อคุณได้รับสินค้าและเช็คแล้วโอเค กดปุ่มยืนยันรับสินค้า เงินจะโอนให้ผู้ขายทันที
                  <br />
                  <span className="text-sm">
                    *หากไม่มีการยืนยันภายใน 48 ชม. ระบบจะปล่อยเงินให้ผู้ขายอัตโนมัติ
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-4xl font-bold mb-4">
            เริ่มต้นใช้งานวันนี้ ฟรี!
          </h3>
          <p className="text-xl mb-8 opacity-90">
            ไม่มีค่าสมัคร ไม่มีค่าธรรมเนียมซ่อนเร้น
          </p>
          <Link href="/auth/login">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              สมัครใช้งานเลย
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 SafePay Thailand. All rights reserved.</p>
          <p className="text-sm mt-2">
            แพลตฟอร์มพักเงินสำหรับการซื้อขายปลอดภัยบนโซเชียลมีเดีย
          </p>
        </div>
      </footer>
    </div>
  );
}
