'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@essy/ui';

export default function ShipDealPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;
  const [formData, setFormData] = useState({
    tracking_number: '',
    courier: '',
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/deals/${dealId}/ship`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer mock_token`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (res.ok) {
        router.push('/seller/dashboard');
      } else {
        alert('เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error shipping deal:', error);
      alert('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">เพิ่มเลขพัสดุ</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                เลขพัสดุ *
              </label>
              <input
                type="text"
                required
                value={formData.tracking_number}
                onChange={(e) =>
                  setFormData({ ...formData, tracking_number: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="TH123456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                บริษัทขนส่ง *
              </label>
              <select
                required
                value={formData.courier}
                onChange={(e) =>
                  setFormData({ ...formData, courier: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">-- เลือกบริษัทขนส่ง --</option>
                <option value="Kerry Express">Kerry Express</option>
                <option value="J&T Express">J&T Express</option>
                <option value="Flash Express">Flash Express</option>
                <option value="Thailand Post">Thailand Post</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? 'กำลังบันทึก...' : 'บันทึกเลขพัสดุ'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
