"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { apiFetch } from "@/lib/utils";
import type { DealStatus } from "@essy/core";

interface Deal {
  id: string;
  title: string;
  amount_satang: number;
  currency: string;
  status: DealStatus;
  seller: {
    display_name: string;
    seller_profile?: {
      verified: boolean;
      promptpay_name: string;
    };
  };
}

export default function PayPage() {
  const params = useParams();
  const token = params.token as string;
  const [deal, setDeal] = useState<Deal | null>(null);
  const [qrString, setQrString] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeal();
  }, [token]);

  async function loadDeal() {
    try {
      // In production, fetch deal by token
      // For now, create payment and get QR
      const res = await apiFetch(`/deals?token=${token}`);
      if (!res.ok) throw new Error("Deal not found");
      const data = await res.json();
      setDeal(data);

      // Create payment charge
      const chargeRes = await apiFetch("/payments/create", {
        method: "POST",
        body: JSON.stringify({ dealId: data.id }),
      });
      const chargeData = await chargeRes.json();
      setQrString(chargeData.qrString);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMockPayment() {
    if (!deal || !qrString) return;

    try {
      // Simulate webhook
      const res = await apiFetch("/payments/webhook/mock", {
        method: "POST",
        body: JSON.stringify({ dealId: deal.id }),
      });
      if (res.ok) {
        setPaid(true);
        setDeal({ ...deal, status: "HOLD" });
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return <div className="container mx-auto p-8">กำลังโหลด...</div>;
  }

  if (!deal) {
    return <div className="container mx-auto p-8">ไม่พบรายการ</div>;
  }

  const amountBaht = (deal.amount_satang / 100).toFixed(2);

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{deal.title}</CardTitle>
          <CardDescription>
            ผู้ขาย: {deal.seller.display_name}
            {deal.seller.seller_profile?.verified && (
              <span className="ml-2 text-green-600">✓ Verified Seller</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold">{amountBaht} THB</span>
            <StatusBadge status={deal.status} />
          </div>

          {!paid && qrString && (
            <>
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG value={qrString} size={256} />
              </div>
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-600">
                  สแกน QR Code เพื่อชำระเงินผ่าน PromptPay
                </p>
                <Button onClick={handleMockPayment} size="lg" className="w-full">
                  อัปสลิป (Mock)
                </Button>
                <p className="text-xs text-gray-500">
                  เงินยังไม่เข้าผู้ขาย จนกว่าคุณจะกดยืนยันรับของ หรือระบบเห็นว่า
                  &apos;จัดส่งสำเร็จ&apos; แล้ว
                </p>
              </div>
            </>
          )}

          {paid && (
            <div className="text-center space-y-4 p-6 bg-green-50 rounded-lg">
              <p className="text-lg font-semibold text-green-700">
                ✅ ชำระแล้ว (รอโอนให้ผู้ขายหลังคุณยืนยัน)
              </p>
              <p className="text-sm text-gray-600">
                เงินถูกพักไว้ในระบบแล้ว เมื่อผู้ขายจัดส่งและคุณยืนยันรับของ
                เงินจะถูกโอนให้ผู้ขายอัตโนมัติ
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
