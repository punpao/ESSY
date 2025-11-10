'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@essy/ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function DisputePage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.length < 10) {
      alert('กรุณากรอกเหตุผลอย่างน้อย 10 ตัวอักษร');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/disputes/${dealId}/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reasonText: reason }),
      });

      if (res.ok) {
        alert('เปิดข้อพิพาทสำเร็จ');
        router.push('/buyer/deals');
      } else {
        const data = await res.json();
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">เปิดข้อพิพาท</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลือกเหตุผล *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="radio" name="reasonType" value="not_received" className="mr-2" />
                  <span>ของยังไม่ถึง</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="reasonType" value="not_as_described" className="mr-2" />
                  <span>ของไม่ตรงปก</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="reasonType" value="other" className="mr-2" />
                  <span>อื่น ๆ</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รายละเอียด *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="อธิบายปัญหาที่เกิดขึ้น..."
                required
                minLength={10}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'กำลังส่ง...' : 'ส่งข้อพิพาท'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                ยกเลิก
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
