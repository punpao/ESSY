'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { formatThaiCurrency, DealStatus } from '@thai-escrow/core';
import { Plus, Package, Shield, Copy, ExternalLink } from 'lucide-react';

export default function SellerDashboard() {
  const [deals, setDeals] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [dealsRes, profileRes] = await Promise.all([api.getMyDeals(), api.getSellerProfile()]);

    if (dealsRes.data) {
      // Filter seller deals
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setDeals(dealsRes.data.filter((d: any) => d.seller_id === user.id));
    }

    if (profileRes.data) {
      setProfile(profileRes.data);
    }

    setLoading(false);
  };

  const copyPaylink = (token: string) => {
    const url = `${window.location.origin}/pay/${token}`;
    navigator.clipboard.writeText(url);
    alert('คัดลอก Paylink แล้ว!');
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-bold">Thai Escrow</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/seller/kyc"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {profile?.verified ? '✓ Verified Seller' : 'ยืนยันตัวตน'}
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
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                แดชบอร์ดผู้ขาย
                {profile?.verified && (
                  <span className="ml-3 text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
                    ✓ Verified
                  </span>
                )}
              </h1>
              {profile && (
                <div className="text-sm text-gray-600 space-y-1">
                  <p>PromptPay: {profile.promptpay_id}</p>
                  <p>คะแนนความน่าเชื่อถือ: {profile.reputation_score}</p>
                </div>
              )}
            </div>
            <Link
              href="/seller/deal/new"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              สร้าง Paylink
            </Link>
          </div>
        </div>

        {/* Deals List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold">รายการขายของฉัน</h2>
          </div>

          {deals.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">ยังไม่มีรายการขาย</p>
              <p className="text-sm">สร้าง Paylink เพื่อเริ่มขายของ</p>
            </div>
          ) : (
            <div className="divide-y">
              {deals.map((deal) => (
                <DealRow key={deal.id} deal={deal} onCopyPaylink={copyPaylink} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DealRow({ deal, onCopyPaylink }: any) {
  const router = useRouter();
  const canShip = deal.status === 'HOLD';

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">{deal.title}</h3>
          <p className="text-2xl font-bold text-blue-600 mb-2">
            {formatThaiCurrency(deal.amount_satang)}
          </p>
          <StatusBadge status={deal.status as DealStatus} />
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 mb-2">
            {new Date(deal.created_at).toLocaleDateString('th-TH')}
          </p>
          {deal.buyer_id && (
            <p className="text-sm text-gray-600 mb-2">
              ผู้ซื้อ: {deal.buyer?.display_name}
            </p>
          )}
        </div>
      </div>

      {deal.tracking_number && (
        <div className="bg-purple-50 p-3 rounded-lg mb-3 text-sm">
          <p>
            <strong>Tracking:</strong> {deal.tracking_number} ({deal.courier})
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {deal.status === 'PENDING' && (
          <button
            onClick={() => onCopyPaylink(deal.paylink_token)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
          >
            <Copy className="w-4 h-4" />
            คัดลอก Paylink
          </button>
        )}

        {canShip && (
          <button
            onClick={() =>
              router.push(`/seller/deal/${deal.id}/ship`)
            }
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
          >
            <Package className="w-4 h-4" />
            เพิ่ม Tracking
          </button>
        )}

        <Link
          href={`/seller/deal/${deal.id}`}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
        >
          <ExternalLink className="w-4 h-4" />
          ดูรายละเอียด
        </Link>
      </div>
    </div>
  );
}
