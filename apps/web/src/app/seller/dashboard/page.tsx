"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { api } from "@/lib/api";

export default function SellerDashboard() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, create a /seller/deals endpoint
    api.getAdminDeals()
      .then((data) => {
        // Filter by current user's deals
        setDeals(data.deals || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="container mx-auto px-4 py-16">กำลังโหลด...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">แดชบอร์ดผู้ขาย</h1>
        <Link href="/seller/deal/new">
          <Button>สร้าง Paylink</Button>
        </Link>
      </div>

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
                    {deal.status === "HOLD" && (
                      <Link href={`/seller/deal/${deal.id}/ship`}>
                        <Button variant="outline" size="sm">
                          เพิ่มเลขพัสดุ
                        </Button>
                      </Link>
                    )}
                    <Link href={`/seller/deal/${deal.id}`}>
                      <Button variant="ghost" size="sm">
                        ดูรายละเอียด
                      </Button>
                    </Link>
                  </div>
                </div>
                {deal.paylinkToken && (
                  <p className="text-xs text-gray-400 mt-2">
                    Paylink: {deal.paylinkToken}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
