'use client';

import { useEffect, useState } from "react";
import { useAuth } from "../../../components/auth-provider";
import { getSellerDeals, shipDeal } from "../../../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@escrow/ui";
import { Button, StatusBadge } from "@escrow/ui";
import { formatBaht } from "../../../lib/format";
import Link from "next/link";

type SellerDeal = {
  id: string;
  paylinkToken: string;
  title: string;
  status: "PENDING" | "HOLD" | "SHIPPED" | "RELEASED" | "DISPUTE" | "REFUND";
  amountSatang: number;
  buyer?: { id: string; displayName: string } | null;
  payment?: { status: string } | null;
  dispute?: { status: string } | null;
};

export default function SellerDashboardPage() {
  const auth = useAuth();
  const [deals, setDeals] = useState<SellerDeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.token || auth.user?.role !== "seller") return;
    setLoading(true);
    getSellerDeals(auth.token)
      .then((res) => setDeals(res.deals as SellerDeal[]))
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [auth.token, auth.user]);

  if (!auth.token) {
    return (
      <div className="mx-auto mt-20 max-w-3xl text-center">
        <h1 className="text-2xl font-bold text-slate-900">เข้าสู่ระบบเพื่อดูแดชบอร์ดผู้ขาย</h1>
        <p className="mt-3 text-sm text-slate-600">
          กด “เข้าสู่ระบบผู้ขาย” ที่มุมขวาบนเพื่อสร้างลิงก์และบริหารดีล
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-10 max-w-5xl space-y-6 px-6 pb-16">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">แดชบอร์ดผู้ขาย</h1>
          <p className="text-sm text-slate-600">
            ตรวจสอบสถานะเงินพักไว้ อัปเดต Tracking และปิดดีลอย่างปลอดภัย
          </p>
        </div>
        <Button asChild>
          <Link href="/seller/deal/new">+ สร้าง Paylink ใหม่</Link>
        </Button>
      </div>

      {loading && <p className="text-sm text-slate-500">กำลังโหลดข้อมูล...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>ดีลล่าสุด</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {deals.length === 0 && (
            <p className="rounded-xl bg-slate-100 p-6 text-center text-sm text-slate-500">
              ยังไม่มีดีล ลองสร้าง Paylink แล้วส่งให้ลูกค้าผ่านแชทได้เลย
            </p>
          )}

          {deals.map((deal) => (
            <div
              key={deal.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900">{deal.title}</h3>
                  <StatusBadge status={deal.status} />
                </div>
                <p className="text-sm text-slate-600">
                  ยอด {formatBaht(deal.amountSatang)} • ผู้ซื้อ:{" "}
                  {deal.buyer?.displayName ?? "รอการชำระ"}
                </p>
                {deal.dispute && (
                  <p className="text-xs text-orange-600">
                    มีข้อพิพาท: {deal.dispute.status} — ติดต่อลูกค้าเพื่อส่งหลักฐานเพิ่ม
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 text-sm">
                <Link href={`/pay/${deal.paylinkToken}`} className="text-brand hover:underline">
                  เปิด paylink
                </Link>
                <Link
                  href={`/seller/deal/new?template=${deal.id}`}
                  className="text-slate-500 hover:text-slate-700"
                >
                  สร้างลิงก์คล้ายกัน
                </Link>
                  {deal.status === "HOLD" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const trackingNumber = window.prompt("ระบุเลขพัสดุ");
                        if (!trackingNumber) return;
                        const courier = window.prompt("ระบุบริษัทขนส่ง", "Thailand Post") ?? "ไม่ระบุ";
                        try {
                          await shipDeal(auth.token!, deal.id, { trackingNumber, courier });
                          alert("บันทึกข้อมูลจัดส่งแล้ว");
                          setDeals((prev) =>
                            prev.map((d) =>
                              d.id === deal.id ? { ...d, status: "SHIPPED" } : d
                            )
                          );
                        } catch (err) {
                          alert((err as Error).message);
                        }
                      }}
                    >
                      แจ้งเลขพัสดุ
                    </Button>
                  )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
