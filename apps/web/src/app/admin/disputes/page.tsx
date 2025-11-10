'use client';

import { useState, useEffect } from 'react';
import { DealStatusBadge } from '@/components/DealStatusBadge';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Dispute {
  id: string;
  status: string;
  reasonText: string;
  createdAt: string;
  deal: {
    id: string;
    title: string;
    amountSatang: number;
    status: string;
  };
  opener: {
    displayName: string;
  };
  evidence: Array<{ id: string; url: string; kind: string }>;
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/admin/disputes`)
      .then((res) => res.json())
      .then((data) => {
        setDisputes(data.disputes || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleResolve = async (disputeId: string, resolution: 'RESOLVED_REFUND' | 'RESOLVED_RELEASE') => {
    const note = prompt('กรุณากรอกหมายเหตุการแก้ไข:');
    if (!note || note.length < 10) {
      alert('กรุณากรอกหมายเหตุอย่างน้อย 10 ตัวอักษร');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/v1/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution, resolutionNote: note }),
      });

      if (res.ok) {
        alert('แก้ไขข้อพิพาทสำเร็จ');
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
        <h1 className="text-3xl font-bold mb-8">จัดการข้อพิพาท</h1>

        {loading ? (
          <div className="text-center py-12">กำลังโหลด...</div>
        ) : disputes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">ไม่มีข้อพิพาท</p>
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <div key={dispute.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">{dispute.deal.title}</h2>
                    <p className="text-gray-600">เปิดโดย: {dispute.opener.displayName}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(dispute.createdAt).toLocaleString('th-TH')}
                    </p>
                    <div className="mt-2">
                      <DealStatusBadge status={dispute.status as any} />
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="font-semibold mb-2">เหตุผล:</p>
                  <p className="text-gray-700">{dispute.reasonText}</p>
                </div>

                {dispute.evidence.length > 0 && (
                  <div className="mb-4">
                    <p className="font-semibold mb-2">หลักฐาน:</p>
                    <div className="space-y-2">
                      {dispute.evidence.map((ev) => (
                        <a
                          key={ev.id}
                          href={ev.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-blue-600 hover:underline"
                        >
                          {ev.kind}: {ev.url}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {dispute.status === 'OPEN' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolve(dispute.id, 'RESOLVED_REFUND')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      คืนเงิน
                    </button>
                    <button
                      onClick={() => handleResolve(dispute.id, 'RESOLVED_RELEASE')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      โอนเงินให้ผู้ขาย
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
