'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';

interface Deal {
  id: string;
  title: string;
  amountSatang: number;
  status: string;
  seller: {
    displayName: string;
  };
  buyer?: {
    displayName: string;
  };
}

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    // Mock data - in production, fetch from API with filter
    setTimeout(() => {
      setDeals([
        {
          id: 'deal-1',
          title: 'iPhone 13 Pro Max',
          amountSatang: 3500000,
          status: 'HOLD',
          seller: { displayName: 'ผู้ขายทดสอบ' },
        },
        {
          id: 'deal-2',
          title: 'MacBook Air M2',
          amountSatang: 4500000,
          status: 'SHIPPED',
          seller: { displayName: 'ผู้ขายทดสอบ' },
        },
      ]);
      setLoading(false);
    }, 500);
  }, [statusFilter]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">จัดการรายการขาย</h1>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded"
          >
            <option value="">ทั้งหมด</option>
            <option value="PENDING">รอชำระเงิน</option>
            <option value="HOLD">เงินถูกพัก</option>
            <option value="SHIPPED">จัดส่งแล้ว</option>
            <option value="RELEASED">โอนเงินแล้ว</option>
            <option value="DISPUTE">มีข้อพิพาท</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-16">กำลังโหลด...</div>
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
                      <p className="text-sm text-gray-500 mt-1">
                        ผู้ขาย: {deal.seller.displayName}
                      </p>
                    </div>
                    <StatusBadge status={deal.status as any} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      ดูรายละเอียด
                    </Button>
                    {deal.status === 'SHIPPED' && (
                      <Button size="sm">บังคับโอนเงิน</Button>
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
