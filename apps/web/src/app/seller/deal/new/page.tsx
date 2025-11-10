'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Shield, ArrowLeft } from 'lucide-react';

export default function NewDealPage() {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const amountSatang = Math.round(parseFloat(amount) * 100);

    const result = await api.createDeal({ title, amountSatang });

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      alert('สร้าง Paylink สำเร็จ!');
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
          <h1 className="text-3xl font-bold mb-6">สร้าง Paylink ใหม่</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อสินค้า
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น: iPhone 14 Pro มือสอง สภาพดี"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                minLength={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ราคา (บาท)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="25000"
                step="0.01"
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
              <p className="font-medium mb-2">💡 วิธีใช้งาน:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>กดสร้าง Paylink</li>
                <li>คัดลอกลิงก์ไปส่งให้ผู้ซื้อใน LINE/FB/IG</li>
                <li>ผู้ซื้อโอนเงิน → เงินพักที่ Thai Escrow</li>
                <li>คุณส่งของ → เพิ่ม tracking</li>
                <li>ผู้ซื้อยืนยัน → คุณได้เงิน!</li>
              </ol>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 text-lg"
            >
              {loading ? 'กำลังสร้าง...' : 'สร้าง Paylink'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
