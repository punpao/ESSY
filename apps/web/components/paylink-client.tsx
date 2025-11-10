'use client';

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription } from "@escrow/ui";
import { createPromptPayCharge } from "../lib/api";
import { formatBaht } from "../lib/format";

type PaylinkClientProps = {
  token: string;
  deal: {
    id: string;
    title: string;
    amountSatang: number;
    status: string;
    sellerName: string;
    paymentStatus: string;
  };
};

export function PaylinkClient({ token, deal }: PaylinkClientProps) {
  const [qr, setQr] = useState<string | null>(null);
  const [providerRef, setProviderRef] = useState<string | null>(null);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const res = await createPromptPayCharge({
        paylinkToken: token,
        buyerEmail: buyerEmail || undefined,
        buyerDisplayName: buyerName || undefined
      });
      setQr(res.qrString);
      setProviderRef(res.providerRef);
      setMessage(res.message);
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{deal.title}</CardTitle>
          <CardDescription>
            ยอดโอน: {formatBaht(deal.amountSatang)} • ผู้ขาย: {deal.sellerName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600">
          <p className="rounded-lg bg-slate-100 p-4 text-slate-700">
            เงินยังไม่เข้าผู้ขาย จนกว่าคุณจะกดยืนยันรับของ หรือระบบเห็นว่า “จัดส่งสำเร็จ” แล้ว
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                อีเมลสำหรับส่งสลิป (ใช้อ้างอิง)
              </label>
              <input
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                ชื่อผู้รับสินค้า
              </label>
              <input
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="ชื่อเล่นหรือชื่อจริง"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
              />
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? "กำลังสร้าง QR..." : "สร้าง PromptPay QR เพื่อชำระ"}
          </Button>
          {message && (
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>
          )}
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {qr && (
        <Card>
          <CardHeader>
            <CardTitle>สแกนด้วยแอปธนาคารของคุณ</CardTitle>
            <CardDescription>
              ใช้เมนูสแกน QR PromptPay แล้วระบบจะพักเงินไว้ให้ทันที
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-dashed border-brand bg-white p-6 text-center text-sm text-slate-700">
              <p className="font-semibold text-brand">PromptPay QR</p>
              <p className="break-words font-mono text-xs text-slate-500">{qr}</p>
            </div>
            {providerRef && (
              <p className="text-xs text-slate-500">
                รหัสอ้างอิงการชำระ: <span className="font-mono">{providerRef}</span>
              </p>
            )}
            <div className="rounded-lg bg-slate-100 p-4 text-xs text-slate-600">
              <p className="font-semibold text-slate-700">หลังจากชำระแล้ว</p>
              <ul className="mt-2 space-y-1">
                <li>• เงินถูกพักไว้ รอผู้ขายอัปเดตการจัดส่ง</li>
                <li>• คุณจะได้รับแจ้งเตือนให้กดยืนยันรับของ</li>
                <li>• หากมีปัญหา กดเปิดข้อพิพาทได้ในทันที</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
