'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { formatThaiCurrency, DealStatus } from '@thai-escrow/core';
import { Shield, Package, AlertTriangle, CheckCircle } from 'lucide-react';

export default function BuyerDealsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    const result = await api.getMyDeals();
    if (result.data) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setDeals(result.data.filter((d: any) => d.buyer_id === user.id));
    }
    setLoading(false);
  };

  const handleConfirm = async (dealId: string) => {
    const confirmed = confirm('ยืนยันว่าได้รับสินค้าแล้ว?\n(เงินจะโอนให้ผู้ขายทันที)');
    if (!confirmed) return;

    const result = await api.confirmDeal(dealId);
    if (result.error) {
      alert('เกิดข้อผิดพลาด: ' + result.error);
    } else {
      alert('ยืนยันสำเร็จ! เงินโอนให้ผู้ขายแล้ว');
      loadDeals();
    }
  };

  const handleOpenDispute = (dealId: string) => {
    router.push(`/buyer/dispute/new?dealId=${dealId}`);
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
            <span className="text-xl font-bold">Thai Escrow</span>
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
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">รายการซื้อของฉัน</h1>

        {deals.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg text-gray-600">ยังไม่มีรายการซื้อ</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onConfirm={handleConfirm}
                onOpenDispute={handleOpenDispute}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DealCard({ deal, onConfirm, onOpenDispute }: any) {
  const canConfirm = deal.status === 'SHIPPED';
  const canDispute = ['HOLD', 'SHIPPED'].includes(deal.status);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-2">{deal.title}</h3>
          <p className="text-2xl font-bold text-blue-600 mb-2">
            {formatThaiCurrency(deal.amount_satang)}
          </p>
          <StatusBadge status={deal.status as DealStatus} />
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">
            {new Date(deal.created_at).toLocaleDateString('th-TH')}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            ผู้ขาย: {deal.seller.display_name}
          </p>
        </div>
      </div>

      {deal.tracking_number && (
        <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mb-4">
          <p className="text-sm text-purple-900">
            <strong>Tracking:</strong> {deal.tracking_number} ({deal.courier})
          </p>
          {deal.delivered_at && (
            <p className="text-sm text-purple-800 mt-1">
              คาดว่าจะส่งถึง: {new Date(deal.delivered_at).toLocaleDateString('th-TH')}
            </p>
          )}
        </div>
      )}

      {deal.status === 'HOLD' && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4 text-sm text-blue-800">
          <p>💰 เงินพักไว้แล้ว! รอผู้ขายจัดส่งสินค้า</p>
        </div>
      )}

      {deal.status === 'RELEASED' && (
        <div className="bg-green-50 p-4 rounded-lg mb-4 text-sm text-green-800 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <p>เสร็จสมบูรณ์! เงินโอนให้ผู้ขายแล้ว</p>
        </div>
      )}

      {deal.status === 'DISPUTE' && (
        <div className="bg-red-50 p-4 rounded-lg mb-4 text-sm text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <p>กำลังพิจารณาข้อพิพาท...</p>
        </div>
      )}

      <div className="flex gap-2">
        {canConfirm && (
          <button
            onClick={() => onConfirm(deal.id)}
            className="flex-1 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            ยืนยันรับสินค้า
          </button>
        )}

        {canDispute && (
          <button
            onClick={() => onOpenDispute(deal.id)}
            className="px-4 py-3 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-5 h-5" />
            เปิดข้อพิพาท
          </button>
        )}
      </div>
    </div>
  );
}
