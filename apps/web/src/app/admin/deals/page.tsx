'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { formatThaiCurrency, DealStatus } from '@thai-escrow/core';
import { Shield } from 'lucide-react';

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadDeals();
  }, [filter]);

  const loadDeals = async () => {
    const result = await api.getAdminDeals(filter === 'ALL' ? undefined : filter);
    if (result.data) {
      setDeals(result.data.deals);
    }
    setLoading(false);
  };

  const handleForceRelease = async (dealId: string) => {
    const note = prompt('กรอกหมายเหตุการปล่อยเงิน:');
    if (!note) return;

    const result = await api.forceRelease(dealId, note);
    if (result.error) {
      alert('เกิดข้อผิดพลาด: ' + result.error);
    } else {
      alert('ปล่อยเงินสำเร็จ!');
      loadDeals();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-bold">Thai Escrow Admin</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/admin/deals" className="text-sm font-semibold text-blue-600">
              Deals
            </Link>
            <Link href="/admin/disputes" className="text-sm text-gray-600 hover:text-gray-900">
              Disputes
            </Link>
            <button
              onClick={() => {
                localStorage.clear();
                router.push('/');
              }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Deals</h1>

          <div className="flex gap-2">
            {['ALL', 'PENDING', 'HOLD', 'SHIPPED', 'RELEASED', 'DISPUTE', 'REFUND'].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm ${
                    filter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {status}
                </button>
              )
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seller / Buyer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deals.map((deal) => (
                <tr key={deal.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{deal.title}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(deal.created_at).toLocaleDateString('th-TH')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatThaiCurrency(deal.amount_satang)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={deal.status as DealStatus} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>S: {deal.seller?.display_name}</div>
                    <div>B: {deal.buyer?.display_name || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {deal.status === 'HOLD' || deal.status === 'SHIPPED' ? (
                      <button
                        onClick={() => handleForceRelease(deal.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Force Release
                      </button>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
