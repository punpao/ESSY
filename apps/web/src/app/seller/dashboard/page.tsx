"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { apiFetch } from "@/lib/utils";
import type { DealStatus } from "@essy/core";

interface Deal {
  id: string;
  title: string;
  amount_satang: number;
  status: DealStatus;
  created_at: string;
  buyer?: { display_name: string };
}

export default function SellerDashboard() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeals();
  }, []);

  async function loadDeals() {
    try {
      const res = await apiFetch("/deals?role=seller");
      if (res.ok) {
        const data = await res.json();
        setDeals(data.deals || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="container mx-auto p-8">กำลังโหลด...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">แดชบอร์ดผู้ขาย</h1>
        <Button asChild>
          <Link href="/seller/deal/new">สร้าง Paylink</Link>
        </Button>
      </div>

      {deals.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 mb-4">ยังไม่มีรายการ</p>
            <Button asChild>
              <Link href="/seller/deal/new">สร้าง Paylink แรก</Link>
            </Button>
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
                    <p className="text-sm text-gray-500 mt-1">
                      {(deal.amount_satang / 100).toFixed(2)} THB
                    </p>
                  </div>
                  <StatusBadge status={deal.status} />
                </div>
              </CardHeader>
              <CardContent>
                {deal.buyer && (
                  <p className="text-sm text-gray-600 mb-2">
                    ผู้ซื้อ: {deal.buyer.display_name}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/seller/deals/${deal.id}`}>ดูรายละเอียด</Link>
                  </Button>
                  {deal.status === "HOLD" && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/seller/deals/${deal.id}/ship`}>เพิ่มเลขพัสดุ</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
