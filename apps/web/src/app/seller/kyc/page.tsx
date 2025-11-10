'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Shield, ArrowLeft } from 'lucide-react';

export default function KYCPage() {
  const [promptpayId, setPromptpayId] = useState('');
  const [promptpayName, setPromptpayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await api.submitKyc({ promptpayId, promptpayName });

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      alert('ส่งข้อมูลยืนยันตัวตนสำเร็จ! รอ Admin อนุมัติ');
      router.push('/seller/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/seller/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
            กลับไปแดชบอร์ด
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6">ยืนยันตัวตน (KYC)</h1>

          <div className="bg-blue-50 p-4 rounded-lg mb-6 text-sm text-blue-800">
            <p className="font-medium mb-2">🛡️ ทำไมต้องยืนยันตัวตน?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>ได้ Verified Seller Badge (เพิ่มความน่าเชื่อถือ)</li>
              <li>รับเงินผ่าน PromptPay ตรง</li>
              <li>ผู้ซื้อมั่นใจมากขึ้น</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หมายเลข PromptPay
              </label>
              <input
                type="text"
                value={promptpayId}
                onChange={(e) => setPromptpayId(e.target.value)}
                placeholder="0812345678 หรือเลขบัตรประชาชน"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                minLength={10}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อบัญชี PromptPay
              </label>
              <input
                type="text"
                value={promptpayName}
                onChange={(e) => setPromptpayName(e.target.value)}
                placeholder="นาย สมชาย ใจดี"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                minLength={2}
              />
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg text-sm text-yellow-800">
              <p>
                <strong>หมายเหตุ:</strong> ใน MVP นี้ใช้ mock verification<br />
                ระบบจริงจะมีการถ่ายรูปหน้า + บัตรประชาชน
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 text-lg"
            >
              {loading ? 'กำลังส่ง...' : 'ส่งข้อมูลยืนยันตัวตน'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
