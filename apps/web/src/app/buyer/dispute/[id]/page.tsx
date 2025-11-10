'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@essy/ui';

export default function DisputePage() {
  const params = useParams();
  const dealId = params.id as string;
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState({ url: '', kind: 'image' as const });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      // Open dispute
      const disputeRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/disputes/${dealId}/open`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer mock_token`,
          },
          body: JSON.stringify({
            reason_text: reason,
          }),
        }
      );

      const dispute = await disputeRes.json();

      // Add evidence if provided
      if (evidence.url) {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/disputes/${dispute.id}/evidence`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer mock_token`,
            },
            body: JSON.stringify(evidence),
          }
        );
      }

      alert('เปิด Dispute เรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error opening dispute:', error);
      alert('เกิดข้อผิดพลาด');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">เปิด Dispute</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                เลือกเหตุผล *
              </label>
              <select
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">-- เลือกเหตุผล --</option>
                <option value="ของยังไม่ถึง">ของยังไม่ถึง</option>
                <option value="ของไม่ตรงปก">ของไม่ตรงปก</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>

            {reason === 'อื่นๆ' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  รายละเอียดเพิ่มเติม
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                อัปโหลดหลักฐาน (URL)
              </label>
              <input
                type="url"
                value={evidence.url}
                onChange={(e) =>
                  setEvidence({ ...evidence, url: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="https://example.com/evidence.jpg"
              />
              <select
                value={evidence.kind}
                onChange={(e) =>
                  setEvidence({
                    ...evidence,
                    kind: e.target.value as 'image' | 'chatlog' | 'other',
                  })
                }
                className="mt-2 px-4 py-2 border rounded-lg"
              >
                <option value="image">รูปภาพ</option>
                <option value="chatlog">บันทึกการสนทนา</option>
                <option value="other">อื่นๆ</option>
              </select>
            </div>

            <Button type="submit" className="w-full" size="lg">
              ส่ง Dispute
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
