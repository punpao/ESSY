'use client';

import { useEffect, useState } from "react";
import { useAuth } from "../../../components/auth-provider";
import { getAdminDisputes, resolveDispute } from "../../../lib/api";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@escrow/ui";

type AdminDispute = {
  id: string;
  status: "OPEN" | "NEED_MORE_INFO" | "RESOLVED_REFUND" | "RESOLVED_RELEASE";
  reasonText: string;
  createdAt: string;
  deal: { id: string; title: string; sellerId: string; seller: { displayName: string } };
  openedBy: { displayName: string };
};

const STATUS_OPTIONS = ["ALL", "OPEN", "NEED_MORE_INFO", "RESOLVED_REFUND", "RESOLVED_RELEASE"] as const;

export default function AdminDisputesPage() {
  const auth = useAuth();
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_OPTIONS)[number]>("OPEN");
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDisputes = () => {
    if (!auth.token || auth.user?.role !== "admin") return;
    setLoading(true);
    getAdminDisputes(auth.token, statusFilter === "ALL" ? undefined : statusFilter)
      .then((res) => setDisputes(res.disputes as AdminDispute[]))
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDisputes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, auth.token]);

  if (auth.user?.role !== "admin") {
    return (
      <div className="mx-auto mt-20 max-w-3xl text-center">
        <h1 className="text-2xl font-bold text-slate-900">สำหรับทีมงานเท่านั้น</h1>
      </div>
    );
  }

  const handleResolve = async (disputeId: string, resolution: "REFUND" | "RELEASE") => {
    const note = window.prompt("หมายเหตุเพิ่มเติมในการตัดสิน (เช่น เหตุผลประกอบ)");
    try {
      await resolveDispute(auth.token!, disputeId, { resolution, note: note ?? undefined });
      alert("บันทึกการตัดสินแล้ว");
      fetchDisputes();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-5xl space-y-6 px-6 pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">คิวข้อพิพาท</h1>
          <p className="text-sm text-slate-600">
            จัดการภายใน 24–72 ชั่วโมง พร้อมระบุผลลัพธ์ ให้ทีมงานมีมาตรฐานเดียวกัน
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_OPTIONS)[number])}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              สถานะ: {status === "ALL" ? "ทั้งหมด" : status}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-slate-500">กำลังโหลดข้อมูล...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {disputes.map((dispute) => (
        <Card key={dispute.id}>
          <CardHeader>
            <CardTitle>{dispute.deal.title}</CardTitle>
            <p className="text-sm text-slate-600">
              ผู้ซื้อ: {dispute.openedBy.displayName} • ผู้ขาย: {dispute.deal.seller.displayName}
            </p>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <p className="rounded-lg bg-slate-100 p-3">{dispute.reasonText}</p>
            <div className="flex flex-wrap gap-2">
              {dispute.status === "OPEN" || dispute.status === "NEED_MORE_INFO" ? (
                <>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleResolve(dispute.id, "REFUND")}
                  >
                    คืนเงินผู้ซื้อ
                  </Button>
                  <Button size="sm" onClick={() => handleResolve(dispute.id, "RELEASE")}>
                    ปล่อยเงินให้ผู้ขาย
                  </Button>
                </>
              ) : (
                <span className="text-xs uppercase text-slate-500">
                  ปิดข้อพิพาทแล้ว: {dispute.status}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
