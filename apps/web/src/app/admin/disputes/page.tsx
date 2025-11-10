'use client';

import { useEffect, useState } from 'react';
import { Button } from '@essy/ui';

interface Dispute {
  id: string;
  reason_text: string;
  status: string;
  created_at: string;
  deal: {
    title: string;
    amount_satang: number;
  };
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisputes();
  }, []);

  async function fetchDisputes() {
    // Mock data
    setDisputes([
      {
        id: '1',
        reason_text: 'ของยังไม่ถึง',
        status: 'OPEN',
        created_at: new Date().toISOString(),
        deal: {
          title: 'iPhone 13 Pro Max',
          amount_satang: 3500000,
        },
      },
    ]);
    setLoading(false);
  }

  async function handleResolve(disputeId: string, resolution: 'REFUND' | 'RELEASE') {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/disputes/${disputeId}/resolve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer mock_token`,
          },
          body: JSON.stringify({
            resolution: `RESOLVED_${resolution}`,
            resolution_note: 'Resolved by admin',
          }),
        }
      );

      if (res.ok) {
        alert('แก้ไขปัญหาเรียบร้อยแล้ว');
        fetchDisputes();
      }
    } catch (error) {
      console.error('Error resolving:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">จัดการ Disputes</h1>

        {loading ? (
          <div className="text-center">กำลังโหลด...</div>
        ) : disputes.length === 0 ? (
          <div className="text-center text-gray-500">ไม่มี Dispute</div>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <div key={dispute.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {dispute.deal.title}
                    </h3>
                    <p className="text-gray-600">
                      {(dispute.deal.amount_satang / 100).toLocaleString('th-TH')}{' '}
                      บาท
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      เหตุผล: {dispute.reason_text}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      สร้างเมื่อ:{' '}
                      {new Date(dispute.created_at).toLocaleString('th-TH')}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                    {dispute.status}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleResolve(dispute.id, 'REFUND')}
                    variant="destructive"
                  >
                    คืนเงิน
                  </Button>
                  <Button
                    onClick={() => handleResolve(dispute.id, 'RELEASE')}
                  >
                    โอนเงินให้ผู้ขาย
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
