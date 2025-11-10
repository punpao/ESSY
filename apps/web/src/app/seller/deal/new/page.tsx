'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@essy/ui';

export default function NewDealPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount_satang: '',
    buyer_note: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/deals`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer mock_token`, // Mock auth
          },
          body: JSON.stringify({
            title: formData.title,
            amount_satang: parseInt(formData.amount_satang) * 100, // Convert to satang
            buyer_note: formData.buyer_note,
          }),
        }
      );

      const data = await res.json();
      if (data.paylink_url) {
        router.push(`/seller/deal/success?url=${encodeURIComponent(data.paylink_url)}`);
      }
    } catch (error) {
      console.error('Error creating deal:', error);
      alert('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">สร้าง Paylink ใหม่</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                ชื่อสินค้า *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="เช่น iPhone 13 Pro Max 256GB"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                ราคา (บาท) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.amount_satang}
                onChange={(e) =>
                  setFormData({ ...formData, amount_satang: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="35000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                หมายเหตุสำหรับผู้ซื้อ (ไม่บังคับ)
              </label>
              <textarea
                value={formData.buyer_note}
                onChange={(e) =>
                  setFormData({ ...formData, buyer_note: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
                rows={3}
                placeholder="เช่น สภาพดีมาก ใช้งานได้ปกติ"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? 'กำลังสร้าง...' : 'สร้าง Paylink'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
