'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@essy/ui';

interface Deal {
  id: string;
  title: string;
  amount_satang: number;
  status: string;
  tracking_number?: string;
  courier?: string;
  created_at: string;
}

export default function BuyerDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock - in production, fetch with auth
    fetchDeals();
  }, []);

  async function fetchDeals() {
    // Mock data
    setDeals([
      {
        id: '1',
        title: 'iPhone 13 Pro Max',
        amount_satang: 3500000,
        status: 'SHIPPED',
        tracking_number: 'TH123456789',
        courier: 'Kerry Express',
        created_at: new Date().toISOString(),
      },
    ]);
    setLoading(false);
  }

  async function handleConfirm(dealId: string) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/deals/${dealId}/confirm`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer mock_token`,
          },
        }
      );

      if (res.ok) {
        alert('ยืนยันรับของเรียบร้อยแล้ว');
        fetchDeals();
      }
    } catch (error) {
      console.error('Error confirming:', error);
    }
  }

  const statusLabels: Record<string, string> = {
    HOLD: 'เงินถูกพัก',
    SHIPPED: 'จัดส่งแล้ว',
    RELEASED: 'โอนเงินแล้ว',
    DISPUTE: 'มีปัญหา',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">รายการซื้อของฉัน</h1>

        {loading ? (
          <div className="text-center">กำลังโหลด...</div>
        ) : deals.length === 0 ? (
          <div className="text-center text-gray-500">ยังไม่มีรายการซื้อ</div>
        ) : (
          <div className="space-y-4">
            {deals.map((deal) => (
              <div key={deal.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{deal.title}</h3>
                    <p className="text-gray-600">
                      {(deal.amount_satang / 100).toLocaleString('th-TH')} บาท
                    </p>
                    {deal.tracking_number && (
                      <p className="text-sm text-gray-500 mt-2">
                        เลขพัสดุ: {deal.tracking_number} ({deal.courier})
                      </p>
                    )}
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {statusLabels[deal.status] || deal.status}
                  </span>
                </div>

                <div className="flex gap-2">
                  {deal.status === 'SHIPPED' && (
                    <Button
                      onClick={() => handleConfirm(deal.id)}
                      className="flex-1"
                    >
                      ยืนยันรับของ
                    </Button>
                  )}
                  <Link href={`/buyer/dispute/${deal.id}`}>
                    <Button variant="outline" className="flex-1">
                      เปิด Dispute
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
