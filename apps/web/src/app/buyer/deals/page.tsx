"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Deal {
  id: string;
  title: string;
  amountSatang: number;
  status: string;
  seller: {
    displayName: string;
  };
  trackingNumber?: string;
  courier?: string;
}

export default function BuyerDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      // Mock API call
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/deals`);
      const data = await res.json();
      setDeals(Array.isArray(data) ? data : data.deals || []);
    } catch (error) {
      console.error("Error fetching deals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (dealId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/deals/${dealId}/confirm`,
        { method: "POST" }
      );
      if (res.ok) {
        await fetchDeals();
      }
    } catch (error) {
      console.error("Error confirming deal:", error);
    }
  };

  const handleOpenDispute = async (dealId: string) => {
    const reason = prompt("กรุณาระบุเหตุผล:");
    if (!reason) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/disputes/${dealId}/open`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reasonText: reason }),
        }
      );
      if (res.ok) {
        await fetchDeals();
      }
    } catch (error) {
      console.error("Error opening dispute:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      HOLD: { label: "เงินถูกพัก", variant: "default" },
      SHIPPED: { label: "ส่งของแล้ว", variant: "secondary" },
      RELEASED: { label: "โอนเงินแล้ว", variant: "default" },
      DISPUTE: { label: "มีข้อพิพาท", variant: "destructive" },
    };
    const s = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-16 text-center">กำลังโหลด...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-blue-600">ESSY - รายการซื้อของฉัน</h1>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {deals.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-gray-500">ยังไม่มีรายการซื้อ</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {deals.map((deal) => (
              <Card key={deal.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{deal.title}</CardTitle>
                      <CardDescription>จาก {deal.seller.displayName}</CardDescription>
                    </div>
                    {getStatusBadge(deal.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <p className="text-xl font-semibold">
                      {(deal.amountSatang / 100).toLocaleString()} ฿
                    </p>
                    <div className="flex gap-2">
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
                  {deal.trackingNumber && (
                    <p className="text-sm text-gray-600 mt-2">
                      พัสดุ: {deal.trackingNumber} ({deal.courier})
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
