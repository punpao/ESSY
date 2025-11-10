'use client';

import { useEffect, useState } from "react";
import { useAuth } from "../../../components/auth-provider";
import { adminForceRelease, getAdminDeals } from "../../../lib/api";
import { Button, Card, CardContent, CardHeader, CardTitle, StatusBadge } from "@escrow/ui";
import { formatBaht } from "../../../lib/format";

type AdminDeal = {
  id: string;
  title: string;
  status: "PENDING" | "HOLD" | "SHIPPED" | "RELEASED" | "DISPUTE" | "REFUND";
  amountSatang: number;
  seller: { displayName: string; email?: string };
  buyer?: { displayName: string; email?: string } | null;
};

const STATUSES = ["ALL", "PENDING", "HOLD", "SHIPPED", "DISPUTE", "REFUND", "RELEASED"] as const;

export default function AdminDealsPage() {
  const auth = useAuth();
  const [statusFilter, setStatusFilter] = useState<(typeof STATUSES)[number]>("ALL");
  const [deals, setDeals] = useState<AdminDeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDeals = () => {
    if (!auth.token || auth.user?.role !== "admin") return;
    setLoading(true);
    getAdminDeals(auth.token, statusFilter === "ALL" ? undefined : statusFilter)
      .then((res) => setDeals(res.deals as AdminDeal[]))
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, auth.token]);

  if (auth.user?.role !== "admin") {
    return (
      <div className="mx-auto mt-20 max-w-3xl text-center">
        <h1 className="text-2xl font-bold text-slate-900">สำหรับทีมงานเท่านั้น</h1>
      </div>
    );
  }

  const handleForceRelease = async (dealId: string) => {
    if (!window.confirm("ปล่อยเงินให้ผู้ขายทันที?")) return;
    try {
      await adminForceRelease(auth.token!, dealId);
      alert("ปล่อยเงินเรียบร้อย");
      fetchDeals();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-5xl space-y-6 px-6 pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">แดชบอร์ดทีมงาน</h1>
          <p className="text-sm text-slate-600">
            ตรวจสอบดีลที่รอการปล่อยเงินหรือข้อพิพาทค้างคา
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as (typeof STATUSES)[number])}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              สถานะ: {status === "ALL" ? "ทั้งหมด" : status}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-slate-500">กำลังโหลดข้อมูล...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {deals.map((deal) => (
        <Card key={deal.id}>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{deal.title}</CardTitle>
              <p className="text-sm text-slate-600">
                ผู้ขาย: {deal.seller.displayName} • ผู้ซื้อ: {deal.buyer?.displayName ?? "ยังไม่ระบุ"}
              </p>
            </div>
            <StatusBadge status={deal.status} />
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">ยอด {formatBaht(deal.amountSatang)}</p>
            <div className="flex gap-2">
              {["HOLD", "SHIPPED", "DISPUTE"].includes(deal.status) && (
                <Button variant="outline" size="sm" onClick={() => handleForceRelease(deal.id)}>
                  ปล่อยเงิน
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
