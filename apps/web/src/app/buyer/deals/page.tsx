'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@essy/ui';
import { DealStatusBadge } from '@/components/DealStatusBadge';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Deal {
  id: string;
  title: string;
  amountSatang: number;
  status: string;
  trackingNumber?: string;
  courier?: string;
}

export default function BuyerDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock: In production, fetch with auth token
    fetch(`${API_URL}/api/v1/admin/deals`)
      .then((res) => res.json())
      .then((data) => {
        // Filter to buyer's deals (in production, use proper endpoint)
        setDeals(data.deals?.filter((d: Deal) => d.status !== 'PENDING') || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleConfirm = async (dealId: string) => {
    if (!confirm('ยืนยันว่าคุณได้รับสินค้าแล้ว?')) return;

    try {
      const res = await fetch(`${API_URL}/api/v1/deals/${dealId}/confirm`, {
        method: 'POST',
      });

      if (res.ok) {
        alert('ยืนยันสำเร็จ! เงินจะถูกโอนให้ผู้ขาย');
        window.location.reload();
      } else {
        alert('เกิดข้อผิดพลาด');
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาด');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">รายการซื้อของฉัน</h1>

        {loading ? (
          <div className="text-center py-12">กำลังโหลด...</div>
        ) : deals.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">ยังไม่มีรายการ</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deals.map((deal) => (
              <div key={deal.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">{deal.title}</h2>
                    <p className="text-lg text-blue-600">
                      {(deal.amountSatang / 100).toLocaleString('th-TH')} บาท
                    </p>
                    <div className="mt-2">
                      <DealStatusBadge status={deal.status as any} />
                    </div>
                    {deal.trackingNumber && (
                      <p className="text-sm text-gray-600 mt-2">
                        ติดตาม: {deal.courier} - {deal.trackingNumber}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  {deal.status === 'SHIPPED' && (
                    <Button onClick={() => handleConfirm(deal.id)}>ยืนยันรับของ</Button>
                  )}
                  {(deal.status === 'HOLD' || deal.status === 'SHIPPED') && (
                    <Link href={`/buyer/dispute/${deal.id}`}>
                      <Button variant="outline">เปิดข้อพิพาท</Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
