"use client";

import { useEffect, useState } from "react";
import { getJson } from "@/lib/api";
import { Deal } from "@/lib/types";
import { StatusBadge, Card, CardContent, CardHeader, CardTitle, ThaiEmptyState, Button } from "@escrow/ui";
import { formatDateTime, formatTHBFromSatang } from "@/lib/format";
import Link from "next/link";

export default function SellerDashboardPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadDeals = async () => {
      try {
        const data = await getJson<{ deals: Deal[] }>("/seller/deals");
        setDeals(data.deals);
      } catch (error) {
        setMessage((error as Error).message);
      }
    };
    void loadDeals();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ภาพรวมผู้ขาย</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm">
          <Link href="/seller/deal/new">
            <Button>สร้าง Paylink ใหม่</Button>
          </Link>
          <Link href="/seller/kyc">
            <Button variant="secondary">ตรวจสอบตัวตน / PromptPay</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ดีลล่าสุด</CardTitle>
        </CardHeader>
        <CardContent>
          {deals.length === 0 ? (
            <ThaiEmptyState
              title="ยังไม่มีดีล"
              description="สร้าง Paylink แรกของคุณเพื่อเริ่มพักเงินอย่างปลอดภัย"
              action={
                <Link href="/seller/deal/new">
                  <Button>สร้าง Paylink</Button>
                </Link>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="px-3 py-2">ดีล</th>
                    <th className="px-3 py-2">ยอด</th>
                    <th className="px-3 py-2">สถานะ</th>
                    <th className="px-3 py-2">อัปเดตล่าสุด</th>
                    <th className="px-3 py-2">การชำระ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-slate-50">
                      <td className="px-3 py-3">
                        <div className="font-medium text-slate-900">{deal.title}</div>
                        <div className="text-xs text-slate-500">
                          Paylink: {deal.paylinkToken.slice(0, 8)}...
                        </div>
                      </td>
                      <td className="px-3 py-3">{formatTHBFromSatang(deal.amountSatang)}</td>
                      <td className="px-3 py-3">
                        <StatusBadge status={deal.status} />
                      </td>
                      <td className="px-3 py-3">{formatDateTime(deal.createdAt)}</td>
                      <td className="px-3 py-3">
                        {deal.payments.some((p) => p.status === "PAID")
                          ? "ชำระแล้ว"
                          : "รอชำระ"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {message ? <p className="mt-3 text-xs text-rose-500">{message}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
