import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">ESSY</h1>
          <p className="text-2xl text-gray-600 mb-8">
            ระบบ Escrow สำหรับการซื้อขายออนไลน์
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            โอนแล้วพักเงินจนกว่าคุณจะกดยืนยัน
            <br />
            เงินยังไม่เข้าผู้ขาย จนกว่าคุณจะกดยืนยันรับของ หรือระบบเห็นว่า &apos;จัดส่งสำเร็จ&apos;
            แล้ว
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle>🛡️ ปลอดภัย</CardTitle>
              <CardDescription>
                เงินถูกพักไว้ในระบบ จนกว่าคุณจะยืนยันรับของ
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>⚡ เร็ว</CardTitle>
              <CardDescription>
                ชำระเงินผ่าน PromptPay QR Code ได้ทันที
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>✅ ตรวจสอบได้</CardTitle>
              <CardDescription>
                ผู้ขายผ่านการยืนยันตัวตน และมีระบบ Reputation
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center">
          <Link href="/seller/dashboard">
            <Button size="lg" className="mr-4">
              สำหรับผู้ขาย
            </Button>
          </Link>
          <Link href="/buyer/deals">
            <Button size="lg" variant="outline">
              สำหรับผู้ซื้อ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
