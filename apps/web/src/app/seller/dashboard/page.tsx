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
  paylinkToken: string;
  createdAt: string;
}

export default function SellerDashboard() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock: In production, fetch with auth token
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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">แดชบอร์ดผู้ขาย</h1>
          <Link href="/seller/deal/new">
            <Button>สร้าง Paylink</Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">กำลังโหลด...</div>
        ) : deals.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">ยังไม่มีรายการ</p>
            <Link href="/seller/deal/new">
              <Button>สร้าง Paylink แรก</Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">รายการ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">จำนวนเงิน</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paylink</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {deals.map((deal) => (
                  <tr key={deal.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{deal.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(deal.amountSatang / 100).toLocaleString('th-TH')} บาท
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <DealStatusBadge status={deal.status as any} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Link
                        href={`/pay/${deal.paylinkToken}`}
                        className="text-blue-600 hover:underline"
                        target="_blank"
                      >
                        ดู Paylink
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link href={`/seller/deals/${deal.id}`}>
                        <Button variant="outline" size="sm">
                          ดูรายละเอียด
                        </Button>
                      </Link>
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
