'use client';

import { useEffect, useState } from 'react';
import { Button } from '@essy/ui';

interface Deal {
  id: string;
  title: string;
  amount_satang: number;
  status: string;
  seller: {
    display_name: string;
  };
  buyer: {
    display_name: string;
  } | null;
  created_at: string;
}

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchDeals();
  }, [filter]);

  async function fetchDeals() {
    try {
      const url = new URL(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/admin/deals`
      );
      if (filter) {
        url.searchParams.set('status', filter);
      }

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer mock_token`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setDeals(data);
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleForceRelease(dealId: string) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/admin/deals/${dealId}/release`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer mock_token`,
          },
        }
      );

      if (res.ok) {
        alert('บังคับโอนเงินเรียบร้อย');
        fetchDeals();
      }
    } catch (error) {
      console.error('Error releasing:', error);
    }
  }

  const statusLabels: Record<string, string> = {
    PENDING: 'รอชำระเงิน',
    HOLD: 'เงินถูกพัก',
    SHIPPED: 'จัดส่งแล้ว',
    RELEASED: 'โอนเงินแล้ว',
    DISPUTE: 'มีปัญหา',
    REFUND: 'คืนเงินแล้ว',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">จัดการ Deals</h1>

        <div className="mb-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">ทั้งหมด</option>
            <option value="PENDING">รอชำระเงิน</option>
            <option value="HOLD">เงินถูกพัก</option>
            <option value="SHIPPED">จัดส่งแล้ว</option>
            <option value="RELEASED">โอนเงินแล้ว</option>
            <option value="DISPUTE">มีปัญหา</option>
            <option value="REFUND">คืนเงินแล้ว</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center">กำลังโหลด...</div>
        ) : deals.length === 0 ? (
          <div className="text-center text-gray-500">ไม่มี Deal</div>
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
                    <p className="text-sm text-gray-500 mt-2">
                      ผู้ขาย: {deal.seller.display_name} | ผู้ซื้อ:{' '}
                      {deal.buyer?.display_name || 'ยังไม่มี'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      สร้างเมื่อ:{' '}
                      {new Date(deal.created_at).toLocaleString('th-TH')}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {statusLabels[deal.status] || deal.status}
                  </span>
                </div>

                {deal.status === 'SHIPPED' && (
                  <Button
                    onClick={() => handleForceRelease(deal.id)}
                    size="sm"
                    variant="outline"
                  >
                    บังคับโอนเงิน
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
