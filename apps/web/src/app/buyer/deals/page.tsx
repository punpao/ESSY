'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';

interface Deal {
  id: string;
  title: string;
  amountSatang: number;
  status: string;
  trackingNumber?: string;
}

export default function BuyerDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data
    setTimeout(() => {
      setDeals([
        {
          id: 'deal-1',
          title: 'iPhone 13 Pro Max 256GB',
          amountSatang: 3500000,
          status: 'HOLD',
        },
        {
          id: 'deal-2',
          title: 'MacBook Air M2',
          amountSatang: 4500000,
          status: 'SHIPPED',
          trackingNumber: 'TH123456789',
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const handleConfirm = async (dealId: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/deals/${dealId}/confirm`, {
        method: 'POST',
      });
      setDeals(deals.map((d) => (d.id === dealId ? { ...d, status: 'RELEASED' } : d)));
    } catch (error) {
      console.error('Failed to confirm', error);
    }
  };

  const handleOpenDispute = (dealId: string) => {
    window.location.href = `/buyer/dispute/${dealId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">รายการซื้อของฉัน</h1>

        {loading ? (
          <div className="text-center py-16">กำลังโหลด...</div>
        ) : deals.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-gray-600">ยังไม่มีรายการซื้อ</p>
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
                      {deal.trackingNumber && (
                        <p className="text-sm text-gray-500 mt-1">
                          พัสดุ: {deal.trackingNumber}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={deal.status as any} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {deal.status === 'SHIPPED' && (
                      <Button onClick={() => handleConfirm(deal.id)}>
                        ยืนยันรับของ
                      </Button>
                    )}
                    {(deal.status === 'HOLD' || deal.status === 'SHIPPED') && (
                      <Button variant="outline" onClick={() => handleOpenDispute(deal.id)}>
                        เปิดข้อพิพาท
                      </Button>
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
