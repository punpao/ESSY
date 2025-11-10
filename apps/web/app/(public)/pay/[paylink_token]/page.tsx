"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getJson, postJson } from "@/lib/api";
import { Button, Card, CardContent, CardHeader, CardTitle, ThaiEmptyState } from "@escrow/ui";
import { formatTHBFromSatang } from "@/lib/format";
import { useAuthStore } from "@/store/auth";

interface DealResponse {
  deal: {
    id: string;
    title: string;
    amountSatang: number;
    status: string;
    seller: {
      displayName: string;
      sellerProfile?: {
        promptpayName: string;
        verified: boolean;
        reputationScore: number;
      } | null;
    };
    paylinkToken: string;
    expiresAt: string;
  };
}

interface PaymentCreateResponse {
  payment_id: string;
  provider_ref: string;
  qr_string: string;
  amount_satang: number;
}

export default function PaylinkPage() {
  const params = useParams<{ paylink_token: string }>();
  const token = params.paylink_token;
  const [deal, setDeal] = useState<DealResponse["deal"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<PaymentCreateResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const authUser = useAuthStore((state) => state.user);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getJson<DealResponse>(`/deals/paylink/${token}`);
        setDeal(data.deal);
      } catch (error) {
        setStatusMessage((error as Error).message);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [token]);

  const handleGenerateQR = async () => {
    if (!deal) return;
    try {
      const created = await postJson<PaymentCreateResponse>("/payments/create", {
        paylink_token: deal.paylinkToken,
        buyer_id: authUser?.id
      });
      setPayment(created);
      setStatusMessage("สร้าง QR สำเร็จแล้ว กรุณาชำระผ่านแอปธนาคารของคุณ");
    } catch (error) {
      setStatusMessage((error as Error).message);
    }
  };

  const handleMockPay = async () => {
    if (!deal || !payment) return;
    const payload = {
      provider_ref: payment.provider_ref,
      deal_id: deal.id,
      amount_satang: payment.amount_satang,
      buyer_id: authUser?.id ?? null,
      status: "PAID" as const
    };
    const secret = process.env.NEXT_PUBLIC_MOCK_WEBHOOK_SECRET ?? "";
    if (!secret) {
      setStatusMessage("ไม่พบคีย์สำหรับเซ็น webhook (ตั้งค่า NEXT_PUBLIC_MOCK_WEBHOOK_SECRET)");
      return;
    }

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      {
        name: "HMAC",
        hash: "SHA-256"
      },
      false,
      ["sign"]
    );
    const bodyString = JSON.stringify(payload);
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(bodyString));
    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ""}/payments/webhook/mock`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-mock-signature": signature
      },
      body: bodyString
    });

    setStatusMessage("ชำระเงินแล้ว ระบบพักเงินไว้จนกว่าคุณจะกดยืนยันรับของ");
  };

  if (loading) {
    return <p>กำลังโหลด...</p>;
  }

  if (!deal) {
    return (
      <ThaiEmptyState
        title="ไม่พบเพย์ลิงก์"
        description="ลิงก์อาจหมดอายุ หรือถูกยกเลิกโดยผู้ขาย"
      />
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-5">
      <div className="md:col-span-3 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>ดีล: {deal.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              <span className="font-medium text-slate-900">ยอดชำระ:</span>{" "}
              {formatTHBFromSatang(deal.amountSatang)}
            </p>
            <p>
              <span className="font-medium text-slate-900">ผู้ขาย:</span>{" "}
              {deal.seller.displayName}{" "}
              {deal.seller.sellerProfile?.verified ? (
                <span className="ml-2 rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">
                  ผู้ขายตรวจสอบแล้ว
                </span>
              ) : null}
            </p>
            <p>
              <span className="font-medium text-slate-900">ข้อความสำคัญ:</span>{" "}
              เงินยังไม่เข้าผู้ขาย จนกว่าคุณจะกดยืนยันรับของ หรือระบบเห็นว่า ‘จัดส่งสำเร็จ’ แล้ว
            </p>
            <Button onClick={handleGenerateQR}>สร้าง QR เพื่อชำระ</Button>
            {statusMessage ? (
              <p className="text-xs text-slate-500">{statusMessage}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>PromptPay QR</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {payment ? (
              <>
                <pre className="rounded-md bg-slate-900 p-4 text-xs text-lime-200">
                  {payment.qr_string}
                </pre>
                <Button variant="secondary" onClick={handleMockPay}>
                  จำลองการชำระ / อัปสลิป
                </Button>
              </>
            ) : (
              <ThaiEmptyState
                title="ยังไม่มี QR"
                description="กดปุ่มเพื่อสร้าง PromptPay QR สำหรับการชำระ"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
