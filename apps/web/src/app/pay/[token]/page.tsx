"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Deal {
  id: string;
  title: string;
  amountSatang: number;
  currency: string;
  status: string;
  seller: {
    displayName: string;
    sellerProfile?: {
      verified: boolean;
      promptpayName: string;
    };
  };
  payment?: {
    status: string;
    providerRef?: string;
  };
}

export default function PayPage() {
  const params = useParams();
  const token = params.token as string;
  const [deal, setDeal] = useState<Deal | null>(null);
  const [qrString, setQrString] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>("INIT");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeal();
  }, [token]);

  const fetchDeal = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/deals?paylinkToken=${token}`
      );
      if (!res.ok) {
        throw new Error("Failed to fetch deal");
      }
      const data = await res.json();
      setDeal(data);

      if (data.payment?.status === "PAID") {
        setPaymentStatus("PAID");
      } else if (data.payment?.status === "INIT") {
        // Create payment charge
        const chargeRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/payments/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dealId: data.id }),
        });
        const charge = await chargeRes.json();
        setQrString(charge.qrString);
      }
    } catch (error) {
      console.error("Error fetching deal:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMockPayment = async () => {
    if (!deal || !qrString) return;

    try {
      // Simulate webhook callback
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/payments/webhook/mock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerRef: deal.payment?.providerRef || `MOCK_${Date.now()}`,
          status: "PAID",
          amountSatang: deal.amountSatang,
        }),
      });

      if (res.ok) {
        setPaymentStatus("PAID");
        await fetchDeal();
      }
    } catch (error) {
      console.error("Error processing payment:", error);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-16 text-center">กำลังโหลด...</div>;
  }

  if (!deal) {
    return <div className="container mx-auto px-4 py-16 text-center">ไม่พบรายการ</div>;
  }

  const amountTHB = deal.amountSatang / 100;

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{deal.title}</CardTitle>
            <CardDescription>
              จาก {deal.seller.displayName}
              {deal.seller.sellerProfile?.verified && (
                <Badge className="ml-2" variant="default">
                  Verified Seller
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{amountTHB.toLocaleString()} ฿</p>
              <p className="text-sm text-gray-600 mt-2">จำนวนเงินที่ต้องชำระ</p>
            </div>

            {paymentStatus === "INIT" && qrString && (
              <div className="space-y-4">
                <div className="bg-white p-8 rounded-lg border-2 border-dashed border-gray-300 text-center">
                  <p className="text-sm text-gray-600 mb-4">สแกน QR Code เพื่อชำระเงิน</p>
                  <div className="bg-gray-100 p-4 rounded inline-block">
                    <div className="w-64 h-64 bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                      [QR Code Placeholder]
                      <br />
                      {qrString.substring(0, 50)}...
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">หรือกดปุ่มด้านล่างเพื่อจำลองการชำระเงิน</p>
                </div>

                <Button onClick={handleMockPayment} className="w-full" size="lg">
                  อัปสลิป (Mock)
                </Button>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900 font-semibold mb-2">⚠️ สิ่งสำคัญ</p>
                  <p className="text-xs text-blue-800">
                    เงินยังไม่เข้าผู้ขาย จนกว่าคุณจะกดยืนยันรับของ หรือระบบเห็นว่า
                    "จัดส่งสำเร็จ" แล้ว
                  </p>
                </div>
              </div>
            )}

            {paymentStatus === "PAID" && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <p className="text-lg font-semibold text-green-900 mb-2">✅ ชำระแล้ว</p>
                  <p className="text-sm text-green-800">
                    รอโอนให้ผู้ขายหลังคุณยืนยันรับของ หรือระบบตรวจพบว่าจัดส่งสำเร็จแล้ว
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-900">
                    <strong>สถานะ:</strong> {deal.status === "HOLD" && "เงินถูกพักไว้"}
                    {deal.status === "SHIPPED" && "ผู้ขายได้ส่งของแล้ว"}
                    {deal.status === "RELEASED" && "เงินถูกโอนให้ผู้ขายแล้ว"}
                  </p>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500 text-center">
                หากมีปัญหา กรุณาติดต่อฝ่ายสนับสนุน
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
