"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { formatSatang } from "@/lib/utils";
import { api } from "@/lib/api";

export default function PayPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<any>(null);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    // In real app, fetch deal by paylink_token
    // For now, mock it
    setDeal({
      id: "mock",
      title: "สินค้าทดสอบ",
      amount_satang: 100000,
      seller: { display_name: "ผู้ขายทดสอบ" },
      status: "PENDING",
    });
    setLoading(false);
  }, [token]);

  const handleCreatePayment = async () => {
    if (!deal) return;
    try {
      const result = await api.payments.create(deal.id);
      setPayment(result);
    } catch (error) {
      alert("เกิดข้อผิดพลาด: " + (error as Error).message);
    }
  };

  const handleMockPay = async () => {
    if (!payment) return;
    try {
      await api.payments.webhook({
        provider_ref: payment.provider_ref,
        status: "PAID",
        buyer_id: "mock_buyer",
      });
      setPaid(true);
      alert("ชำระเงินสำเร็จ! เงินถูกพักไว้จนกว่าคุณจะยืนยันรับของ");
    } catch (error) {
      alert("เกิดข้อผิดพลาด: " + (error as Error).message);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-16 text-center">กำลังโหลด...</div>;
  }

  if (!deal) {
    return <div className="container mx-auto px-4 py-16 text-center">ไม่พบ Paylink</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>ชำระเงิน</CardTitle>
            <CardDescription>รายละเอียดการซื้อขาย</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">{deal.title}</h3>
              <p className="text-gray-600">ผู้ขาย: {deal.seller?.display_name}</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {formatSatang(deal.amount_satang)}
              </p>
              <div className="mt-2">
                <StatusBadge status={deal.status} />
              </div>
            </div>

            {!payment && !paid && (
              <Button onClick={handleCreatePayment} className="w-full" size="lg">
                สร้าง QR Code สำหรับชำระเงิน
              </Button>
            )}

            {payment && !paid && (
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-lg border-2 border-dashed">
                  <p className="text-center text-sm text-gray-600 mb-4">
                    สแกน QR Code นี้เพื่อชำระเงินผ่าน PromptPay
                  </p>
                  <div className="bg-gray-200 p-8 rounded-lg text-center">
                    <div className="text-xs font-mono break-all">{payment.qr_string}</div>
                    <p className="text-xs text-gray-500 mt-2">[Mock QR Code]</p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-yellow-800 mb-2">
                    ⚠️ สิ่งสำคัญที่ต้องรู้:
                  </p>
                  <p className="text-sm text-yellow-700">
                    <strong>เงินยังไม่เข้าผู้ขาย</strong> จนกว่าคุณจะกดยืนยันรับของ
                    หรือระบบเห็นว่า &apos;จัดส่งสำเร็จ&apos; แล้ว
                  </p>
                </div>

                <Button onClick={handleMockPay} className="w-full" size="lg" variant="outline">
                  อัปสลิป (Mock - สำหรับทดสอบ)
                </Button>
              </div>
            )}

            {paid && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <p className="text-lg font-semibold text-green-800 mb-2">
                  ✅ ชำระเงินสำเร็จ
                </p>
                <p className="text-sm text-green-700">
                  เงินถูกพักไว้แล้ว รอผู้ขายเพิ่มเลขพัสดุ
                  <br />
                  เมื่อคุณยืนยันรับของ เงินจะถูกโอนให้ผู้ขายทันที
                </p>
                <Button
                  onClick={() => router.push("/buyer/deals")}
                  className="mt-4"
                  variant="outline"
                >
                  ดูรายการซื้อของฉัน
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
