'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';

interface Deal {
  id: string;
  title: string;
  amountSatang: number;
  status: string;
  paylinkToken: string;
  createdAt: string;
}

export default function SellerDashboard() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - in production, fetch from API
    setTimeout(() => {
      setDeals([
        {
          id: 'deal-1',
          title: 'iPhone 13 Pro Max 256GB',
          amountSatang: 3500000,
          status: 'HOLD',
          paylinkToken: 'token-1',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'deal-2',
          title: 'MacBook Air M2',
          amountSatang: 4500000,
          status: 'SHIPPED',
          paylinkToken: 'token-2',
          createdAt: new Date().toISOString(),
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">แดชบอร์ดผู้ขาย</h1>
          <Link href="/seller/deal/new">
            <Button>สร้าง Paylink</Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-16">กำลังโหลด...</div>
        ) : deals.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-gray-600 mb-4">ยังไม่มีรายการขาย</p>
              <Link href="/seller/deal/new">
                <Button>สร้าง Paylink แรก</Button>
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
                      <p className="text-sm text-gray-600 mt-1">
                        {(deal.amountSatang / 100).toLocaleString('th-TH')} บาท
                      </p>
                    </div>
                    <StatusBadge status={deal.status as any} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Link href={`/pay/${deal.paylinkToken}`}>
                      <Button variant="outline" size="sm">
                        ดู Paylink
                      </Button>
                    </Link>
                    {deal.status === 'HOLD' && (
                      <Link href={`/seller/deal/${deal.id}/ship`}>
                        <Button size="sm">เพิ่มหมายเลขพัสดุ</Button>
                      </Link>
                    )}
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
