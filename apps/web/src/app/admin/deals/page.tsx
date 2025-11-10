'use client';

import { useState, useEffect } from 'react';
import { DealStatusBadge } from '@/components/DealStatusBadge';
import { Button } from '@essy/ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Deal {
  id: string;
  title: string;
  amountSatang: number;
  status: string;
  createdAt: string;
  seller: { displayName: string };
  buyer: { displayName: string } | null;
}

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/admin/deals`)
      .then((res) => res.json())
      .then((data) => {
        setDeals(data.deals || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleForceRelease = async (dealId: string) => {
    if (!confirm('ยืนยันที่จะบังคับโอนเงิน?')) return;

    try {
      const res = await fetch(`${API_URL}/api/v1/admin/deals/${dealId}/release`, {
        method: 'POST',
      });

      if (res.ok) {
        alert('โอนเงินสำเร็จ');
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
        <h1 className="text-3xl font-bold mb-8">จัดการรายการทั้งหมด</h1>

        {loading ? (
          <div className="text-center py-12">กำลังโหลด...</div>
        ) : deals.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">ไม่มีรายการ</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">รายการ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ผู้ขาย</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ผู้ซื้อ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">จำนวนเงิน</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {deals.map((deal) => (
                  <tr key={deal.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{deal.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{deal.seller.displayName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{deal.buyer?.displayName || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(deal.amountSatang / 100).toLocaleString('th-TH')} บาท
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <DealStatusBadge status={deal.status as any} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {deal.status !== 'RELEASED' && deal.status !== 'REFUND' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleForceRelease(deal.id)}
                        >
                          บังคับโอน
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
