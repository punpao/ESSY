'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Shield, Clock, AlertTriangle } from 'lucide-react';

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('OPEN');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadDisputes();
  }, [filter]);

  const loadDisputes = async () => {
    const result = await api.getAdminDisputes(filter === 'ALL' ? undefined : filter);
    if (result.data) {
      setDisputes(result.data.disputes);
    }
    setLoading(false);
  };

  const handleResolve = async (disputeId: string, resolution: string) => {
    const resolutionNote = prompt('กรอกหมายเหตุการแก้ไข:');
    if (!resolutionNote) return;

    const result = await api.resolveDispute(disputeId, { resolution, resolutionNote });
    if (result.error) {
      alert('เกิดข้อผิดพลาด: ' + result.error);
    } else {
      alert('แก้ไขข้อพิพาทสำเร็จ!');
      loadDisputes();
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
            <Link href="/admin/deals" className="text-sm text-gray-600 hover:text-gray-900">
              Deals
            </Link>
            <Link href="/admin/disputes" className="text-sm font-semibold text-blue-600">
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
          <h1 className="text-3xl font-bold">ข้อพิพาท</h1>

          <div className="flex gap-2">
            {['ALL', 'OPEN', 'NEED_MORE_INFO', 'RESOLVED_REFUND', 'RESOLVED_RELEASE'].map(
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

        {disputes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-lg text-gray-600">ไม่มีข้อพิพาท</p>
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <DisputeCard
                key={dispute.id}
                dispute={dispute}
                onResolve={handleResolve}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DisputeCard({ dispute, onResolve }: any) {
  const getSLAColor = (slaStatus: string) => {
    switch (slaStatus) {
      case 'on_time': return 'bg-green-100 text-green-800';
      case 'due_24h': return 'bg-yellow-100 text-yellow-800';
      case 'due_soon': return 'bg-orange-100 text-orange-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-2">
            Deal: {dispute.deal.title}
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            ผู้ซื้อ: {dispute.opener.display_name} | ผู้ขาย: {dispute.deal.seller.display_name}
          </p>
          <p className="text-gray-800 mb-3">{dispute.reason_text}</p>
          
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              dispute.status === 'OPEN' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
            }`}>
              {dispute.status}
            </span>
            {dispute.slaStatus && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getSLAColor(dispute.slaStatus)}`}>
                <Clock className="w-4 h-4" />
                {dispute.hoursOpen}h ({dispute.slaStatus})
              </span>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-500">
            {new Date(dispute.created_at).toLocaleDateString('th-TH')}
          </p>
        </div>
      </div>

      {dispute.evidence && dispute.evidence.length > 0 && (
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <p className="text-sm font-medium mb-2">หลักฐาน ({dispute.evidence.length}):</p>
          <ul className="text-sm space-y-1">
            {dispute.evidence.slice(0, 2).map((ev: any) => (
              <li key={ev.id} className="text-gray-600">
                • {ev.kind}: {ev.note || ev.url.substring(0, 50)}...
              </li>
            ))}
          </ul>
        </div>
      )}

      {dispute.status === 'OPEN' || dispute.status === 'NEED_MORE_INFO' ? (
        <div className="flex gap-2">
          <button
            onClick={() => onResolve(dispute.id, 'RESOLVED_REFUND')}
            className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
          >
            คืนเงินผู้ซื้อ (Refund)
          </button>
          <button
            onClick={() => onResolve(dispute.id, 'RESOLVED_RELEASE')}
            className="flex-1 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
          >
            ปล่อยเงินให้ผู้ขาย (Release)
          </button>
        </div>
      ) : (
        <div className="bg-gray-100 p-3 rounded-lg text-sm">
          <p className="font-medium">แก้ไขแล้ว:</p>
          <p className="text-gray-600">{dispute.resolution_note}</p>
        </div>
      )}
    </div>
  );
}
