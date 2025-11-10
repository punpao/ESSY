"use client";

import { useEffect, useState } from "react";
import { AuthToolbar } from "../../../components/AuthToolbar";
import { apiRequest } from "../../../components/api-client";
import { Badge, Button, Card, CardContent, CardHeader } from "@thai-social-escrow/ui";

interface Deal {
  id: string;
  title: string;
  status: string;
  amountSatang: number;
  seller: { displayName: string };
  buyer?: { displayName: string | null } | null;
  createdAt: string;
}

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [message, setMessage] = useState("");

  const loadDeals = async () => {
    try {
      const data = await apiRequest<{ deals: Deal[] }>("/admin/deals");
      setDeals(data.deals);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "โหลดดีลไม่สำเร็จ");
    }
  };

  useEffect(() => {
    loadDeals();
  }, []);

  const forceRelease = async (dealId: string) => {
    try {
      await apiRequest(`/admin/deals/${dealId}/release`, { method: "POST" });
      setMessage("ปล่อยเงินให้ผู้ขายแล้ว");
      loadDeals();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "ปล่อยเงินไม่สำเร็จ");
    }
  };

  const refund = async (dealId: string) => {
    try {
      await apiRequest(`/payments/${dealId}/refund`, { method: "POST", body: { note: "Admin refund" } });
      setMessage("คืนเงินให้ผู้ซื้อแล้ว");
      loadDeals();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "คืนเงินไม่สำเร็จ");
    }
  };

  return (
    <div className="space-y-6">
      <AuthToolbar />
      <h1 className="text-2xl font-semibold text-emerald-700">ดีลทั้งหมด</h1>
      {message && <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}
      <div className="space-y-3">
        {deals.map((deal) => (
          <Card key={deal.id}>
            <CardHeader className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{deal.title}</h3>
                <p className="text-xs text-slate-500">
                  ผู้ขาย: {deal.seller.displayName} | ผู้ซื้อ: {deal.buyer?.displayName ?? "-"}
                </p>
              </div>
              <Badge tone={deal.status}>{translateStatus(deal.status)}</Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p>ยอด: {(deal.amountSatang / 100).toLocaleString("th-TH", { style: "currency", currency: "THB" })}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => forceRelease(deal.id)} disabled={!["HOLD", "SHIPPED", "DISPUTE"].includes(deal.status)}>
                  ปล่อยเงิน
                </Button>
                <Button variant="ghost" onClick={() => refund(deal.id)} disabled={deal.status !== "DISPUTE" && deal.status !== "HOLD"}>
                  คืนเงิน
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {deals.length === 0 && <div className="rounded-md border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">ยังไม่มีดีล</div>}
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
      return "โอนให้ผู้ขาย";
    case "DISPUTE":
      return "ข้อพิพาท";
    case "REFUND":
      return "คืนเงินแล้ว";
    default:
      return status;
  }
}
