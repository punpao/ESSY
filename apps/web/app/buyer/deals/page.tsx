'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, StatusBadge } from "@escrow/ui";
import { useAuth } from "../../../components/auth-provider";
import { confirmDeal, getBuyerDeals, openDispute } from "../../../lib/api";
import { formatBaht } from "../../../lib/format";

type BuyerDeal = {
  id: string;
  title: string;
  status: "PENDING" | "HOLD" | "SHIPPED" | "RELEASED" | "DISPUTE" | "REFUND";
  amountSatang: number;
  seller: { displayName: string };
  paylinkToken: string;
  dispute?: { id: string; status: string } | null;
};

const DISPUTE_OPTIONS = ["ของยังไม่ถึง", "ของไม่ตรงปก", "อื่น ๆ"] as const;

export default function BuyerDealsPage() {
  const auth = useAuth();
  const [deals, setDeals] = useState<BuyerDeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.token || auth.user?.role !== "buyer") return;
    setLoading(true);
    getBuyerDeals(auth.token)
      .then((res) => setDeals(res.deals as BuyerDeal[]))
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [auth.token, auth.user]);

  if (!auth.token) {
    return (
      <div className="mx-auto mt-20 max-w-3xl text-center">
        <h1 className="text-2xl font-bold text-slate-900">เข้าสู่ระบบเพื่อดูประวัติการซื้อ</h1>
        <p className="mt-3 text-sm text-slate-600">
          กด “เข้าสู่ระบบผู้ซื้อ” ที่มุมขวาบน แล้วกลับมาหน้านี้อีกครั้ง
        </p>
      </div>
    );
  }

  const handleConfirm = async (dealId: string) => {
    if (!window.confirm("ยืนยันว่าได้รับสินค้าตามที่ตกลง?")) return;
    try {
      await confirmDeal(auth.token!, dealId);
      setDeals((prev) =>
        prev.map((deal) => (deal.id === dealId ? { ...deal, status: "RELEASED" } : deal))
      );
      alert("ขอบคุณค่ะ เราโอนเงินให้ผู้ขายเรียบร้อย");
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleDispute = async (deal: BuyerDeal) => {
    const choice = window.prompt(
      `เลือกเหตุผลข้อพิพาท (พิมพ์ตัวเลข)\n1. ${DISPUTE_OPTIONS[0]}\n2. ${DISPUTE_OPTIONS[1]}\n3. ${DISPUTE_OPTIONS[2]}`
    );
    if (!choice) return;
    const idx = Number(choice) - 1;
    if (idx < 0 || idx >= DISPUTE_OPTIONS.length) {
      alert("กรุณาเลือกหมายเลข 1-3");
      return;
    }
    const reason = window.prompt("อธิบายปัญหาเพิ่มเติม (ไม่เกิน 200 ตัวอักษร)");
    if (!reason) return;

    try {
      const res = await openDispute(auth.token!, deal.id, {
        category: DISPUTE_OPTIONS[idx],
        reason
      });
      alert("เปิดข้อพิพาทเรียบร้อย ทีมงานจะติดต่อกลับ");
      setDeals((prev) =>
        prev.map((d) =>
          d.id === deal.id ? { ...d, status: "DISPUTE", dispute: res.dispute } : d
        )
      );
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-4xl space-y-6 px-6 pb-16">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">ดีลที่ฉันชำระไว้</h1>
        <p className="text-sm text-slate-600">
          ยืนยันรับของ หรือเปิดข้อพิพาทได้จากหน้านี้
        </p>
      </div>
      {loading && <p className="text-sm text-slate-500">กำลังโหลดข้อมูล...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {deals.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-slate-500">
            ยังไม่มีดีลที่ชำระ ผ่านลิงก์จากผู้ขายแล้วลองกลับมาดูอีกครั้งได้ค่ะ
          </CardContent>
        </Card>
      )}

      {deals.map((deal) => (
        <Card key={deal.id} className="border-slate-200">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{deal.title}</CardTitle>
              <p className="text-sm text-slate-600">ผู้ขาย: {deal.seller.displayName}</p>
            </div>
            <StatusBadge status={deal.status} />
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              ยอดชำระ {formatBaht(deal.amountSatang)} • Paylink:{" "}
              <Link href={`/pay/${deal.paylinkToken}`} className="text-brand hover:underline">
                เปิดอีกครั้ง
              </Link>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/pay/${deal.paylinkToken}`, "_blank")}
              >
                ดูรายละเอียดการชำระ
              </Button>
              {deal.status === "SHIPPED" && (
                <Button size="sm" onClick={() => handleConfirm(deal.id)}>
                  ได้รับสินค้าแล้ว
                </Button>
              )}
              {(deal.status === "HOLD" || deal.status === "SHIPPED") && !deal.dispute && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDispute(deal)}
                >
                  เปิดข้อพิพาท
                </Button>
              )}
              {deal.dispute && (
                <Link
                  href={`/buyer/dispute/${deal.dispute.id}`}
                  className="text-sm text-orange-600 hover:underline"
                >
                  ติดตามข้อพิพาท
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
