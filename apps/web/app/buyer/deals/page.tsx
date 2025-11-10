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
  dispute?: { id: string; status: string } | null;
}

export default function BuyerDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [message, setMessage] = useState<string>("");

  const loadDeals = async () => {
    try {
      const data = await apiRequest<{ deals: Deal[] }>("/deals/buyer");
      setDeals(data.deals);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ");
    }
  };

  useEffect(() => {
    loadDeals();
  }, []);

  const confirmDeal = async (dealId: string) => {
    try {
      await apiRequest(`/deals/${dealId}/confirm`, { method: "POST" });
      setMessage("ยืนยันรับของแล้ว ระบบจะโอนเงินให้ผู้ขาย");
      loadDeals();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "ไม่สามารถยืนยันได้");
    }
  };

  const openDispute = async (dealId: string, reason: string) => {
    try {
      await apiRequest(`/disputes/${dealId}/open`, {
        method: "POST",
        body: { reason, detail: "" }
      });
      setMessage("เปิดข้อพิพาทแล้ว ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง");
      loadDeals();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "ไม่สามารถเปิดข้อพิพาทได้");
    }
  };

  return (
    <div className="space-y-6">
      <AuthToolbar />
      <h1 className="text-2xl font-semibold text-emerald-700">คำสั่งซื้อของฉัน</h1>
      {message && <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}
      <div className="space-y-3">
        {deals.map((deal) => (
          <Card key={deal.id}>
            <CardHeader className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{deal.title}</h3>
                <p className="text-xs text-slate-500">ผู้ขาย: {deal.seller.displayName}</p>
              </div>
              <Badge tone={deal.status}>{translateStatus(deal.status)}</Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p>ยอดที่พักเงิน: {(deal.amountSatang / 100).toLocaleString("th-TH", { style: "currency", currency: "THB" })}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => confirmDeal(deal.id)} disabled={deal.status !== "SHIPPED" && deal.status !== "HOLD"}>
                  ยืนยันรับแล้ว
                </Button>
                <Button variant="ghost" onClick={() => openDispute(deal.id, "ของไม่ตรงปก")} disabled={!!deal.dispute}>
                  เปิดข้อพิพาท
                </Button>
                {deal.dispute && (
                  <a className="text-emerald-600 underline" href={`/buyer/dispute/${deal.dispute.id}`}>
                    ดูข้อพิพาท
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {deals.length === 0 && <div className="rounded-md border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">ยังไม่มีคำสั่งซื้อ</div>}
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
      return "อยู่ในข้อพิพาท";
    case "REFUND":
      return "คืนเงินแล้ว";
    default:
      return status;
  }
}
