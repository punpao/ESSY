'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@essy/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const schema = z.object({
  title: z.string().min(1, 'กรุณากรอกชื่อรายการ'),
  amountSatang: z.number().int().positive('กรุณากรอกจำนวนเงิน'),
  buyerNote: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewDealPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Convert THB to satang
      const amountSatang = Math.round(data.amountSatang * 100);

      const res = await fetch(`${API_URL}/api/v1/deals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          amountSatang,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        router.push(`/seller/deals/${result.deal.id}`);
      } else {
        alert('เกิดข้อผิดพลาด: ' + result.error);
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
          <h1 className="text-3xl font-bold mb-6">สร้าง Paylink ใหม่</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อรายการ *
              </label>
              <input
                {...register('title')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="เช่น iPhone 13 Pro Max 256GB"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จำนวนเงิน (บาท) *
              </label>
              <input
                {...register('amountSatang', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="35000"
              />
              {errors.amountSatang && (
                <p className="text-red-500 text-sm mt-1">{errors.amountSatang.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หมายเหตุสำหรับผู้ซื้อ (ไม่บังคับ)
              </label>
              <textarea
                {...register('buyerNote')}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="เช่น สภาพดีมาก ใช้งานได้ปกติ"
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'กำลังสร้าง...' : 'สร้าง Paylink'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                ยกเลิก
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
