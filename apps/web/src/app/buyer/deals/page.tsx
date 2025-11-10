"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { formatSatang } from "@/lib/utils";
import { api } from "@/lib/api";

export default function BuyerDealsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data
    setDeals([
      {
        id: "1",
        title: "iPhone 15 Pro Max",
        amount_satang: 4500000,
        status: "HOLD",
        seller: { display_name: "ผู้ขายทดสอบ" },
        created_at: new Date().toISOString(),
      },
      {
        id: "2",
        title: "MacBook Air M2",
        amount_satang: 3500000,
        status: "SHIPPED",
        seller: { display_name: "ผู้ขายทดสอบ" },
        tracking_number: "TH123456789",
        delivered_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ]);
    setLoading(false);
  }, []);

  const handleConfirm = async (dealId: string) => {
    try {
      await api.deals.confirm(dealId);
      alert("ยืนยันรับของสำเร็จ! เงินถูกโอนให้ผู้ขายแล้ว");
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, status: "RELEASED" } : d))
      );
    } catch (error) {
      alert("เกิดข้อผิดพลาด: " + (error as Error).message);
    }
  };

  const handleOpenDispute = (dealId: string) => {
    window.location.href = `/buyer/dispute/${dealId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">รายการซื้อของฉัน</h1>

        {loading ? (
          <p>กำลังโหลด...</p>
        ) : deals.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-gray-500">
              ยังไม่มีรายการซื้อ
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {deals.map((deal) => (
              <Card key={deal.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{deal.title}</h3>
                      <p className="text-sm text-gray-600 mb-1">
                        ผู้ขาย: {deal.seller?.display_name}
                      </p>
                      <p className="text-xl font-bold text-blue-600 mb-2">
                        {formatSatang(deal.amount_satang)}
                      </p>
                      {deal.tracking_number && (
                        <p className="text-sm text-gray-500">
                          เลขพัสดุ: {deal.tracking_number}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-4">
                      <StatusBadge status={deal.status} />
                      {deal.status === "SHIPPED" && (
                        <div className="flex gap-2">
                          <Button onClick={() => handleConfirm(deal.id)} size="sm">
                            ยืนยันรับของ
                          </Button>
                          <Button
                            onClick={() => handleOpenDispute(deal.id)}
                            size="sm"
                            variant="destructive"
                          >
                            เปิดข้อพิพาท
                          </Button>
                        </div>
                      )}
                      {deal.status === "HOLD" && (
                        <Button
                          onClick={() => handleOpenDispute(deal.id)}
                          size="sm"
                          variant="destructive"
                        >
                          เปิดข้อพิพาท
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
