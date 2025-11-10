"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { formatSatang } from "@/lib/utils";

export default function SellerDashboard() {
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
        buyer: { display_name: "ผู้ซื้อทดสอบ" },
        created_at: new Date().toISOString(),
      },
      {
        id: "2",
        title: "MacBook Air M2",
        amount_satang: 3500000,
        status: "SHIPPED",
        buyer: { display_name: "ผู้ซื้อทดสอบ" },
        tracking_number: "TH123456789",
        created_at: new Date().toISOString(),
      },
    ]);
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">แดชบอร์ดผู้ขาย</h1>
          <Link href="/seller/deal/new">
            <Button>สร้าง Paylink ใหม่</Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-gray-600">ยอดรวมทั้งหมด</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatSatang(8000000)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-gray-600">รอการยืนยัน</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">2</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-gray-600">Reputation Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">85.5</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>รายการขายของฉัน</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>กำลังโหลด...</p>
            ) : deals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">ยังไม่มีรายการขาย</p>
            ) : (
              <div className="space-y-4">
                {deals.map((deal) => (
                  <div
                    key={deal.id}
                    className="flex justify-between items-center p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold">{deal.title}</h3>
                      <p className="text-sm text-gray-600">
                        ผู้ซื้อ: {deal.buyer?.display_name} • {formatSatang(deal.amount_satang)}
                      </p>
                      {deal.tracking_number && (
                        <p className="text-xs text-gray-500">
                          เลขพัสดุ: {deal.tracking_number}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <StatusBadge status={deal.status} />
                      {deal.status === "SHIPPED" && (
                        <Button size="sm" variant="outline">
                          ดูรายละเอียด
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
