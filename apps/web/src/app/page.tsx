import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 text-gray-900">ESSY</h1>
          <p className="text-2xl text-gray-600 mb-8">
            Escrow สำหรับการซื้อขายออนไลน์
          </p>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            โอนแล้วพักเงินจนกว่าคุณจะกดยืนยัน
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <CardTitle>🛡️ ปลอดภัย</CardTitle>
              <CardDescription>
                เงินถูกพักไว้ในระบบ จนกว่าคุณจะยืนยันรับของ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                เงินยังไม่เข้าผู้ขาย จนกว่าคุณจะกดยืนยันรับของ หรือระบบเห็นว่า
                &apos;จัดส่งสำเร็จ&apos; แล้ว
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>⚡ เร็ว</CardTitle>
              <CardDescription>ชำระผ่าน PromptPay QR Code</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                สแกน QR Code และโอนเงินได้ทันที ไม่ต้องกรอกข้อมูลเยอะ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>✅ ตรวจสอบได้</CardTitle>
              <CardDescription>Verified Seller + Reputation</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                ผู้ขายที่ผ่านการตรวจสอบ KYC และมีคะแนนความน่าเชื่อถือ
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <div className="space-x-4">
            <Button asChild size="lg">
              <Link href="/seller/dashboard">สำหรับผู้ขาย</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/buyer/deals">สำหรับผู้ซื้อ</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
