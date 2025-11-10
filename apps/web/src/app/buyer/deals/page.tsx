"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { api } from "@/lib/api";

export default function BuyerDealsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, create a /buyer/deals endpoint
    api.getAdminDeals()
      .then((data) => {
        // Filter by current user's deals as buyer
        setDeals(data.deals || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleConfirm = async (dealId: string) => {
    if (!confirm("ยืนยันรับของแล้วใช่หรือไม่?")) return;

    try {
      await api.confirmDeal(dealId);
      alert("ยืนยันรับของสำเร็จ เงินจะถูกโอนให้ผู้ขาย");
      window.location.reload();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleOpenDispute = async (dealId: string) => {
    const reason = prompt("กรุณาระบุเหตุผล:");
    if (!reason) return;

    try {
      await api.openDispute(dealId, reason);
      alert("เปิดข้อพิพาทสำเร็จ");
      window.location.reload();
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-16">กำลังโหลด...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Deals ของฉัน</h1>

      <div className="grid gap-4">
        {deals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              ยังไม่มี Deal
            </CardContent>
          </Card>
        ) : (
          deals.map((deal) => (
            <Card key={deal.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{deal.title}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(deal.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={deal.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <p className="text-2xl font-bold">{formatCurrency(deal.amountSatang)}</p>
                  <div className="space-x-2">
                    {deal.status === "SHIPPED" && (
                      <Button onClick={() => handleConfirm(deal.id)} size="sm">
                        ยืนยันรับของ
                      </Button>
                    )}
                    {(deal.status === "HOLD" || deal.status === "SHIPPED") && (
                      <Button
                        onClick={() => handleOpenDispute(deal.id)}
                        variant="destructive"
                        size="sm"
                      >
                        เปิดข้อพิพาท
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
