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
  seller: { display_name: string };
  created_at: string;
}

export default function BuyerDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeals();
  }, []);

  async function loadDeals() {
    try {
      const res = await apiFetch("/deals?role=buyer");
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

  async function handleConfirm(dealId: string) {
    try {
      const res = await apiFetch(`/deals/${dealId}/confirm`, {
        method: "POST",
      });
      if (res.ok) {
        loadDeals();
        alert("ยืนยันรับของแล้ว เงินจะถูกโอนให้ผู้ขาย");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด");
    }
  }

  if (loading) {
    return <div className="container mx-auto p-8">กำลังโหลด...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">รายการซื้อของฉัน</h1>

      {deals.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">ยังไม่มีรายการ</p>
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
                      ผู้ขาย: {deal.seller.display_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(deal.amount_satang / 100).toFixed(2)} THB
                    </p>
                  </div>
                  <StatusBadge status={deal.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/buyer/deals/${deal.id}`}>ดูรายละเอียด</Link>
                  </Button>
                  {deal.status === "SHIPPED" && (
                    <Button
                      size="sm"
                      onClick={() => handleConfirm(deal.id)}
                    >
                      ยืนยันรับของ
                    </Button>
                  )}
                  {(deal.status === "HOLD" || deal.status === "SHIPPED") && (
                    <Button variant="destructive" size="sm" asChild>
                      <Link href={`/buyer/dispute/${deal.id}`}>เปิดข้อพิพาท</Link>
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
