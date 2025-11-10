'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { DISPUTE_REASONS_TH } from '@thai-escrow/core';
import { Shield, ArrowLeft } from 'lucide-react';

export default function NewDisputePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dealId = searchParams.get('dealId') || '';

  const [reason, setReason] = useState('not_received');
  const [reasonText, setReasonText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const selectedReason = DISPUTE_REASONS_TH.find((r) => r.value === reason);
    const fullText = `${selectedReason?.label}: ${reasonText}`;

    const result = await api.openDispute(dealId, fullText);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      alert('เปิดข้อพิพาทสำเร็จ! ทีมงานจะติดต่อกลับภายใน 24-72 ชั่วโมง');
      router.push('/buyer/deals');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/buyer/deals" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
            กลับไปรายการซื้อ
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6">เปิดข้อพิพาท</h1>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ สำคัญ:</strong> โปรดให้รายละเอียดครบถ้วน<br />
              ทีมงานจะตรวจสอบและติดต่อกลับภายใน 24-72 ชั่วโมง
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภทปัญหา
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {DISPUTE_REASONS_TH.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รายละเอียด
              </label>
              <textarea
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder="โปรดอธิบายปัญหาโดยละเอียด เช่น: สินค้ามีรอยขีดข่วน, ไม่ตรงรุ่นที่สั่ง, หรือยังไม่ได้รับของ"
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                minLength={10}
              />
              <p className="text-sm text-gray-500 mt-1">
                ต้องมีอย่างน้อย 10 ตัวอักษร
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
              <p className="font-medium mb-2">📸 หลังจากนี้คุณสามารถ:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>อัปโหลดรูปภาพหลักฐาน</li>
                <li>แนบบทสนทนากับผู้ขาย</li>
                <li>ติดตามสถานะข้อพิพาท</li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 text-lg"
            >
              {loading ? 'กำลังส่ง...' : 'ส่งข้อพิพาท'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
