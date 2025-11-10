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
  createdAt: string;
  seller: { displayName: string };
  buyer?: { displayName: string };
}

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    fetchDeals();
  }, [statusFilter]);

  const fetchDeals = async () => {
    try {
      const url = new URL(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/admin/deals`
      );
      if (statusFilter) {
        url.searchParams.set("status", statusFilter);
      }
      const res = await fetch(url.toString());
      const data = await res.json();
      setDeals(data.deals || []);
    } catch (error) {
      console.error("Error fetching deals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleForceRelease = async (dealId: string) => {
    if (!confirm("ยืนยันการโอนเงินทันที?")) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/admin/deals/${dealId}/release`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "Admin force release" }),
        }
      );
      if (res.ok) {
        await fetchDeals();
      }
    } catch (error) {
      console.error("Error force releasing:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      PENDING: { label: "รอชำระเงิน", variant: "outline" },
      HOLD: { label: "เงินถูกพัก", variant: "default" },
      SHIPPED: { label: "ส่งของแล้ว", variant: "secondary" },
      RELEASED: { label: "โอนเงินแล้ว", variant: "default" },
      DISPUTE: { label: "มีข้อพิพาท", variant: "destructive" },
      REFUND: { label: "คืนเงินแล้ว", variant: "destructive" },
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
          <h1 className="text-2xl font-bold text-blue-600">ESSY - จัดการรายการ</h1>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-4 flex gap-2">
          <Button
            variant={statusFilter === "" ? "default" : "outline"}
            onClick={() => setStatusFilter("")}
            size="sm"
          >
            ทั้งหมด
          </Button>
          {["PENDING", "HOLD", "SHIPPED", "RELEASED", "DISPUTE", "REFUND"].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              onClick={() => setStatusFilter(s)}
              size="sm"
            >
              {s}
            </Button>
          ))}
        </div>

        {deals.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-gray-500">ไม่มีรายการ</p>
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
                      <CardDescription>
                        ผู้ขาย: {deal.seller.displayName}
                        {deal.buyer && ` • ผู้ซื้อ: ${deal.buyer.displayName}`}
                      </CardDescription>
                    </div>
                    {getStatusBadge(deal.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <p className="text-xl font-semibold">
                      {(deal.amountSatang / 100).toLocaleString()} ฿
                    </p>
                    {deal.status !== "RELEASED" && deal.status !== "REFUND" && (
                      <Button
                        onClick={() => handleForceRelease(deal.id)}
                        variant="outline"
                        size="sm"
                      >
                        บังคับโอนเงิน
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
