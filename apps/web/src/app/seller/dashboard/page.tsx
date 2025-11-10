'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@essy/ui';

interface Deal {
  id: string;
  title: string;
  amount_satang: number;
  status: string;
  paylink_token: string;
  created_at: string;
}

export default function SellerDashboard() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock - in production, fetch with auth
    fetchDeals();
  }, []);

  async function fetchDeals() {
    // Mock data for demo
    setDeals([
      {
        id: '1',
        title: 'iPhone 13 Pro Max',
        amount_satang: 3500000,
        status: 'HOLD',
        paylink_token: 'abc123',
        created_at: new Date().toISOString(),
      },
    ]);
    setLoading(false);
  }

  const statusLabels: Record<string, string> = {
    PENDING: 'รอชำระเงิน',
    HOLD: 'เงินถูกพัก',
    SHIPPED: 'จัดส่งแล้ว',
    RELEASED: 'โอนเงินแล้ว',
    DISPUTE: 'มีปัญหา',
    REFUND: 'คืนเงินแล้ว',
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    HOLD: 'bg-blue-100 text-blue-800',
    SHIPPED: 'bg-purple-100 text-purple-800',
    RELEASED: 'bg-green-100 text-green-800',
    DISPUTE: 'bg-red-100 text-red-800',
    REFUND: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">แดชบอร์ดผู้ขาย</h1>
          <Link href="/seller/deal/new">
            <Button>สร้าง Paylink</Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">รายการขายทั้งหมด</h2>
          </div>
          {loading ? (
            <div className="p-6 text-center">กำลังโหลด...</div>
          ) : deals.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              ยังไม่มีรายการขาย
            </div>
          ) : (
            <div className="divide-y">
              {deals.map((deal) => (
                <div key={deal.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{deal.title}</h3>
                      <p className="text-gray-600">
                        {(deal.amount_satang / 100).toLocaleString('th-TH')} บาท
                      </p>
                      <p className="text-sm text-gray-500">
                        สร้างเมื่อ:{' '}
                        {new Date(deal.created_at).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          statusColors[deal.status] || statusColors.PENDING
                        }`}
                      >
                        {statusLabels[deal.status] || deal.status}
                      </span>
                      {deal.status === 'HOLD' && (
                        <Link href={`/seller/deals/${deal.id}/ship`}>
                          <Button size="sm" className="mt-2">
                            เพิ่มเลขพัสดุ
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
