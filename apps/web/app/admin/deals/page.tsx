"use client";

import { useEffect, useState } from "react";
import { getJson, postJson } from "@/lib/api";
import { Deal } from "@/lib/types";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  StatusBadge,
  ThaiEmptyState
} from "@escrow/ui";
import { formatDateTime, formatTHBFromSatang } from "@/lib/format";

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const loadDeals = async (status?: string) => {
    try {
      const qs = status ? `?status=${status}` : "";
      const data = await getJson<{ deals: Deal[] }>(`/admin/deals${qs}`);
      setDeals(data.deals);
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  useEffect(() => {
    void loadDeals();
  }, []);

  const handleRelease = async (dealId: string) => {
    const note = window.prompt("ระบุเหตุผลการปล่อยเงิน", "ตรวจสอบแล้วส่งสำเร็จ");
    try {
      await postJson(`/admin/deals/${dealId}/release`, { note });
      setMessage("ปล่อยเงินให้ผู้ขายแล้ว");
      await loadDeals();
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const handleRefund = async (dealId: string) => {
    const reason = window.prompt("ระบุเหตุผลการคืนเงิน", "สินค้ามีปัญหาตามหลักฐาน");
    if (!reason) return;
    try {
      await postJson(`/payments/${dealId}/refund`, { reason });
      setMessage("คืนเงินให้ผู้ซื้อแล้ว");
      await loadDeals();
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ดีลทั้งหมด</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-sm">
          {["ทั้งหมด", "PENDING", "HOLD", "SHIPPED", "DISPUTE", "REFUND"].map((label) => (
            <Button
              key={label}
              variant="secondary"
              onClick={() => void loadDeals(label === "ทั้งหมด" ? undefined : label)}
            >
              {label}
            </Button>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>รายการดีล</CardTitle>
        </CardHeader>
        <CardContent>
          {deals.length === 0 ? (
            <ThaiEmptyState title="ไม่มีดีล" description="ปรับตัวกรองหรือรอข้อมูลใหม่" />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="px-3 py-2">ดีล</th>
                    <th className="px-3 py-2">ยอด</th>
                    <th className="px-3 py-2">สถานะ</th>
                    <th className="px-3 py-2">อัปเดต</th>
                    <th className="px-3 py-2">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-slate-50">
                      <td className="px-3 py-3">
                        <div className="font-medium text-slate-900">{deal.title}</div>
                        <div className="text-xs text-slate-500">ผู้ขาย: {deal.seller.displayName}</div>
                      </td>
                      <td className="px-3 py-3">{formatTHBFromSatang(deal.amountSatang)}</td>
                      <td className="px-3 py-3">
                        <StatusBadge status={deal.status} />
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-500">
                        {formatDateTime(deal.createdAt)}
                      </td>
                      <td className="px-3 py-3 space-y-2">
                        <Button size="sm" onClick={() => handleRelease(deal.id)}>
                          ปล่อยเงิน
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => handleRefund(deal.id)}>
                          คืนเงิน
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {message ? <p className="mt-3 text-xs text-slate-500">{message}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
