"use client";

import { useEffect, useState } from "react";
import { Badge, Card, CardContent, CardHeader, Button } from "@thai-social-escrow/ui";
import { apiRequest } from "../../../components/api-client";
import { AuthToolbar } from "../../../components/AuthToolbar";

interface Deal {
  id: string;
  title: string;
  status: string;
  amountSatang: number;
  paylinkToken: string;
  buyer?: { displayName: string | null } | null;
}

export default function SellerDashboardPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [error, setError] = useState<string>("");

  const fetchDeals = async () => {
    try {
      const data = await apiRequest<{ deals: Deal[] }>("/seller/deals");
      setDeals(data.deals);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลได้");
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  return (
    <div className="space-y-6">
      <AuthToolbar />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-emerald-700">แดชบอร์ดผู้ขาย</h1>
        <Button asChild>
          <a href="/seller/deal/new">สร้าง Paylink</a>
        </Button>
      </div>
      {error && <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      <div className="space-y-3">
        {deals.map((deal) => (
          <Card key={deal.id}>
            <CardHeader className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-slate-800">{deal.title}</h3>
                <p className="text-xs text-slate-500">ผู้ซื้อ: {deal.buyer?.displayName ?? "รอชำระ"}</p>
              </div>
              <Badge tone={deal.status}>{translateStatus(deal.status)}</Badge>
            </CardHeader>
              <CardContent className="flex items-center justify-between text-sm text-slate-600">
              <div>ยอด: {(deal.amountSatang / 100).toLocaleString("th-TH", { style: "currency", currency: "THB" })}</div>
                <a className="text-emerald-600 underline" href={`/pay/${deal.paylinkToken}`}>
                เปิดเพย์ลิงก์
              </a>
            </CardContent>
          </Card>
        ))}
        {deals.length === 0 && <div className="rounded-md border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">ยังไม่มีดีล ลองสร้างเพย์ลิงก์แรกของคุณ</div>}
      </div>
    </div>
  );
}

function translateStatus(status: string) {
  switch (status) {
    case "PENDING":
      return "รอชำระ";
    case "HOLD":
      return "พักเงิน";
    case "SHIPPED":
      return "จัดส่งแล้ว";
    case "RELEASED":
      return "โอนให้ผู้ขายแล้ว";
    case "DISPUTE":
      return "อยู่ระหว่างข้อพิพาท";
    case "REFUND":
      return "คืนเงินแล้ว";
    default:
      return status;
  }
}
