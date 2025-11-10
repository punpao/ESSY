"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Deal {
  id: string;
  title: string;
  amountSatang: number;
  status: string;
  paylinkToken: string;
  createdAt: string;
  buyer?: {
    displayName: string;
  };
}

export default function SellerDashboard() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      // Mock API call - in production, use authenticated endpoint
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/deals`);
      const data = await res.json();
      setDeals(Array.isArray(data) ? data : data.deals || []);
    } catch (error) {
      console.error("Error fetching deals:", error);
    } finally {
      setLoading(false);
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
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">ESSY - สำหรับผู้ขาย</h1>
          <Link href="/">
            <Button variant="ghost">กลับหน้าหลัก</Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">รายการขายของฉัน</h2>
          <Link href="/seller/deal/new">
            <Button>สร้าง Paylink</Button>
          </Link>
        </div>

        {deals.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-gray-500 mb-4">ยังไม่มีรายการขาย</p>
              <Link href="/seller/deal/new">
                <Button>สร้าง Paylink แรกของคุณ</Button>
              </Link>
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
                        {new Date(deal.createdAt).toLocaleDateString("th-TH")}
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
                    <div className="flex gap-2">
                      <Link href={`/pay/${deal.paylinkToken}`}>
                        <Button variant="outline" size="sm">
                          ดู Paylink
                        </Button>
                      </Link>
                      {deal.status === "HOLD" && (
                        <Link href={`/seller/deal/${deal.id}/ship`}>
                          <Button size="sm">เพิ่มหมายเลขพัสดุ</Button>
                        </Link>
                      )}
                    </div>
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
