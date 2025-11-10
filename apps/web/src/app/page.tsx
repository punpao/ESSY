import Link from 'next/link';
import { Shield, MessageCircle, Clock, CheckCircle, TrendingUp, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Thai Escrow</span>
          </div>
          <div className="flex gap-4">
            <Link
              href="/auth/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/auth/login"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              เริ่มต้นใช้งาน
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            ซื้อขายออนไลน์อย่างปลอดภัย<br />
            <span className="text-blue-600">โอนแล้วพักเงินจนกว่าคุณจะยืนยัน</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            ไม่ต้องกลัวโดนโกงอีกต่อไป! ซื้อของผ่าน Facebook, Instagram, LINE<br />
            เงินพักไว้ที่เราจนกว่าคุณจะได้รับสินค้าและยืนยัน
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/seller/dashboard"
              className="px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-lg"
            >
              สร้าง Paylink (ผู้ขาย)
            </Link>
            <Link
              href="/buyer/deals"
              className="px-8 py-4 text-lg font-semibold text-gray-700 bg-white rounded-lg hover:bg-gray-50 shadow-lg border"
            >
              ดูรายการซื้อ (ผู้ซื้อ)
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">ทำไมต้อง Thai Escrow?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Shield className="w-12 h-12 text-blue-600" />}
            title="ปลอดภัย 100%"
            description="เงินพักไว้ที่เราจนกว่าคุณจะยืนยันรับสินค้า ไม่โอนตรงให้ผู้ขายทันที"
          />
          <FeatureCard
            icon={<MessageCircle className="w-12 h-12 text-green-600" />}
            title="ส่ง Paylink ในแชท"
            description="ผู้ขายสร้าง Paylink แล้วส่งให้ผู้ซื้อใน LINE, FB, IG ได้เลย สะดวกสุดๆ"
          />
          <FeatureCard
            icon={<Clock className="w-12 h-12 text-purple-600" />}
            title="โอนผ่าน PromptPay"
            description="สแกน QR PromptPay โอนเงินง่ายๆ ไม่ต้องพิมพ์เลขบัญชี"
          />
          <FeatureCard
            icon={<CheckCircle className="w-12 h-12 text-indigo-600" />}
            title="ตรวจสอบผู้ขาย"
            description="Verified Seller Badge + คะแนนความน่าเชื่อถือ ซื้อใจเย็นๆ"
          />
          <FeatureCard
            icon={<TrendingUp className="w-12 h-12 text-orange-600" />}
            title="จัดการข้อพิพาทด่วน"
            description="ทีมไทยดูแล 24-72 ชม. ถ้ามีปัญหาเราช่วยเคลียร์ให้"
          />
          <FeatureCard
            icon={<Users className="w-12 h-12 text-pink-600" />}
            title="UX ภาษาไทย 100%"
            description="ไม่งง! ทุกอย่างเป็นภาษาไทยชัดเจน เข้าใจง่าย"
          />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">วิธีใช้งาน (3 ขั้นตอนง่ายๆ)</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <StepCard
              step="1"
              title="ผู้ขายสร้าง Paylink"
              description="กรอกชื่อสินค้า ราคา แล้วแชร์ลิงก์ให้ผู้ซื้อในแชท LINE/FB/IG"
            />
            <StepCard
              step="2"
              title="ผู้ซื้อจ่ายผ่าน PromptPay"
              description="สแกน QR โอนเงิน → เงินพักไว้ที่ Thai Escrow (ยังไม่ไปถึงผู้ขาย)"
            />
            <StepCard
              step="3"
              title="ยืนยันรับของ หรือเปิดข้อพิพาท"
              description="ได้ของแล้ว? กดยืนยัน → เงินโอนให้ผู้ขาย | มีปัญหา? เปิดข้อพิพาท"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">พร้อมซื้อขายอย่างปลอดภัยแล้วหรือยัง?</h2>
          <p className="text-xl mb-8 opacity-90">
            เข้าสู่ระบบด้วย LINE หรือ Email ฟรี ไม่มีค่าธรรมเนียมซ่อนเร้น
          </p>
          <Link
            href="/auth/login"
            className="inline-block px-8 py-4 text-lg font-semibold text-blue-600 bg-white rounded-lg hover:bg-gray-100 shadow-lg"
          >
            เริ่มต้นใช้งานเลย
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>&copy; 2024 Thai Escrow. Made with ❤️ for Thai Social Commerce</p>
          <p className="text-sm mt-2">
            MVP - Mock PromptPay Provider | ไม่ใช้เงินจริงในเวอร์ชันนี้
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function StepCard({ step, title, description }: any) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white text-2xl font-bold rounded-full mb-4">
        {step}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
