"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { formatSatang } from "@/lib/utils";

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    // Mock data
    setDeals([
      {
        id: "1",
        title: "iPhone 15 Pro Max",
        amount_satang: 4500000,
        status: "HOLD",
        seller: { display_name: "ผู้ขายทดสอบ" },
        buyer: { display_name: "ผู้ซื้อทดสอบ" },
        created_at: new Date().toISOString(),
      },
      {
        id: "2",
        title: "MacBook Air M2",
        amount_satang: 3500000,
        status: "SHIPPED",
        seller: { display_name: "ผู้ขายทดสอบ" },
        buyer: { display_name: "ผู้ซื้อทดสอบ" },
        created_at: new Date().toISOString(),
      },
    ]);
    setLoading(false);
  }, []);

  const filteredDeals = filter
    ? deals.filter((d) => d.status === filter)
    : deals;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">จัดการรายการซื้อขาย</h1>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="p-2 border rounded-md"
          >
            <option value="">ทั้งหมด</option>
            <option value="PENDING">รอชำระเงิน</option>
            <option value="HOLD">เงินถูกพัก</option>
            <option value="SHIPPED">จัดส่งแล้ว</option>
            <option value="RELEASED">โอนเงินแล้ว</option>
            <option value="DISPUTE">มีข้อพิพาท</option>
            <option value="REFUND">คืนเงินแล้ว</option>
          </select>
        </div>

        {loading ? (
          <p>กำลังโหลด...</p>
        ) : filteredDeals.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-gray-500">
              ไม่มีรายการ
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDeals.map((deal) => (
              <Card key={deal.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{deal.title}</h3>
                      <p className="text-sm text-gray-600 mb-1">
                        ผู้ขาย: {deal.seller?.display_name} • ผู้ซื้อ: {deal.buyer?.display_name}
                      </p>
                      <p className="text-xl font-bold text-blue-600">
                        {formatSatang(deal.amount_satang)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-4">
                      <StatusBadge status={deal.status} />
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          ดูรายละเอียด
                        </Button>
                        {deal.status === "SHIPPED" && (
                          <Button size="sm">บังคับโอนเงิน</Button>
                        )}
                      </div>
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
