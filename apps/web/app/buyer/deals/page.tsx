"use client";

import { useEffect, useState } from "react";
import { getJson, postJson } from "@/lib/api";
import { Deal } from "@/lib/types";
import { Button, Card, CardContent, CardHeader, CardTitle, StatusBadge, ThaiEmptyState } from "@escrow/ui";
import { formatDateTime, formatTHBFromSatang } from "@/lib/format";
import Link from "next/link";

export default function BuyerDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const loadDeals = async () => {
    try {
      const data = await getJson<{ deals: Deal[] }>("/buyer/deals");
      setDeals(data.deals);
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  useEffect(() => {
    void loadDeals();
  }, []);

  const handleConfirm = async (dealId: string) => {
    try {
      await postJson(`/deals/${dealId}/confirm`, { note: "ผู้ซื้อกดยืนยัน" });
      setMessage("ยืนยันรับสินค้าแล้ว ระบบจะโอนเงินให้ผู้ขาย");
      await loadDeals();
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const handleDispute = async (dealId: string) => {
    const reason = window.prompt("เลือกเหตุผล: ของยังไม่ถึง / ของไม่ตรงปก / อื่น ๆ", "ของไม่ตรงปก");
    if (!reason) return;
    try {
      await postJson(`/disputes/${dealId}/open`, {
        reason_text: reason,
        reason_code: reason === "ของยังไม่ถึง" ? "ไม่ถึง" : reason === "ของไม่ตรงปก" ? "ไม่ตรงปก" : "อื่นๆ"
      });
      setMessage("เปิดข้อพิพาทแล้ว ทีมงานจะติดต่อใน 24 ชั่วโมง");
      await loadDeals();
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ดีลของฉัน</CardTitle>
        </CardHeader>
        <CardContent>
          {deals.length === 0 ? (
            <ThaiEmptyState title="ยังไม่มีดีล" description="เมื่อคุณชำระเงินผ่าน Paylink จะแสดงรายการที่นี่" />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="px-3 py-2">ดีล</th>
                    <th className="px-3 py-2">ยอด</th>
                    <th className="px-3 py-2">สถานะ</th>
                    <th className="px-3 py-2">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-slate-50">
                      <td className="px-3 py-3">
                        <div className="font-medium text-slate-900">{deal.title}</div>
                        <div className="text-xs text-slate-500">
                          ผู้ขาย: {deal.seller.displayName}
                        </div>
                      </td>
                      <td className="px-3 py-3">{formatTHBFromSatang(deal.amountSatang)}</td>
                      <td className="px-3 py-3">
                        <StatusBadge status={deal.status} />
                      </td>
                      <td className="px-3 py-3 space-y-2">
                        {deal.status === "HOLD" || deal.status === "SHIPPED" ? (
                          <>
                            <Button size="sm" onClick={() => handleConfirm(deal.id)}>
                              ยืนยันได้รับของ
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleDispute(deal.id)}
                            >
                              เปิดข้อพิพาท
                            </Button>
                          </>
                        ) : deal.status === "DISPUTE" ? (
                          <Link href={`/buyer/dispute/${deal.disputes[0]?.id}`}>
                            <Button size="sm" variant="secondary">
                              ดูข้อพิพาท
                            </Button>
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-500">
                            อัปเดตล่าสุด {formatDateTime(deal.createdAt)}
                          </span>
                        )}
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
