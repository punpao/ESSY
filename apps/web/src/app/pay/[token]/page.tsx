"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";

export default function PayPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [deal, setDeal] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    // Find deal by paylink token
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"}/deals?paylinkToken=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.deal) {
          setDeal(data.deal);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const handleCreatePayment = async () => {
    if (!deal) return;

    setPaying(true);
    try {
      const result = await api.createPayment(deal.id);
      setPayment(result);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setPaying(false);
    }
  };

  const handleMockPayment = async () => {
    if (!payment) return;

    // Simulate webhook
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"}/payments/webhook/mock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "mock_promptpay",
          event: "payment.paid",
          data: {
            providerRef: payment.providerRef,
            status: "paid",
            amountSatang: deal.amountSatang,
            paidAt: new Date().toISOString(),
          },
          signature: "mock_secret",
        }),
      });

      alert("ชำระแล้ว (รอโอนให้ผู้ขายหลังคุณยืนยัน)");
      window.location.reload();
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-16 text-center">กำลังโหลด...</div>;
  }

  if (!deal) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">ไม่พบ Paylink</h1>
        <p>ลิงก์นี้ไม่ถูกต้องหรือหมดอายุแล้ว</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{deal.title}</CardTitle>
          <CardDescription>
            จาก {deal.seller?.displayName || "ผู้ขาย"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-3xl font-bold">{formatCurrency(deal.amountSatang)}</p>
            <StatusBadge status={deal.status} />
          </div>

          {deal.status === "PENDING" && !payment && (
            <div>
              <Button onClick={handleCreatePayment} disabled={paying} className="w-full">
                {paying ? "กำลังสร้าง..." : "สร้าง QR Code สำหรับชำระเงิน"}
              </Button>
            </div>
          )}

          {payment && deal.status === "PENDING" && (
            <div className="space-y-4">
              <div className="bg-gray-100 p-4 rounded text-center">
                <p className="text-sm text-gray-600 mb-2">สแกน QR Code นี้เพื่อชำระเงิน</p>
                <div className="bg-white p-4 inline-block rounded">
                  {/* In production, render actual QR code */}
                  <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
                    QR Code
                    <br />
                    {payment.qrString.substring(0, 20)}...
                  </div>
                </div>
              </div>

              <Button onClick={handleMockPayment} className="w-full" variant="outline">
                อัปสลิป (Mock - สำหรับทดสอบ)
              </Button>

              <p className="text-sm text-gray-500 text-center">
                เงินยังไม่เข้าผู้ขาย จนกว่าคุณจะกดยืนยันรับของ หรือระบบเห็นว่า
                &apos;จัดส่งสำเร็จ&apos; แล้ว
              </p>
            </div>
          )}

          {deal.status === "HOLD" && (
            <div className="bg-blue-50 p-4 rounded">
              <p className="text-blue-800 font-semibold">ชำระแล้ว</p>
              <p className="text-blue-600 text-sm">
                รอโอนให้ผู้ขายหลังคุณยืนยัน หรือหลังจัดส่งสำเร็จ 48 ชั่วโมง
              </p>
            </div>
          )}

          {deal.status === "SHIPPED" && (
            <div className="bg-green-50 p-4 rounded">
              <p className="text-green-800 font-semibold">จัดส่งแล้ว</p>
              <p className="text-green-600 text-sm">
                เลขพัสดุ: {deal.trackingNumber} ({deal.courier})
              </p>
            </div>
          )}

          {deal.status === "RELEASED" && (
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-gray-800 font-semibold">โอนเงินให้ผู้ขายแล้ว</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
