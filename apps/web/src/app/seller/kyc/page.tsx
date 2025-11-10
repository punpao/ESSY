'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@essy/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const schema = z.object({
  promptpayId: z.string().min(10).max(13),
  promptpayName: z.string().min(1),
  selfieUrl: z.string().url().optional(),
});

type FormData = z.infer<typeof schema>;

export default function KYCPage() {
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
      const res = await fetch(`${API_URL}/api/v1/seller/verify/basic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        alert('ส่งข้อมูลแล้ว รอการอนุมัติ');
        router.push('/seller/dashboard');
      } else {
        const result = await res.json();
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
          <h1 className="text-3xl font-bold mb-6">ยืนยันตัวตนผู้ขาย</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลข PromptPay (10-13 หลัก) *
              </label>
              <input
                {...register('promptpayId')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0812345678"
              />
              {errors.promptpayId && (
                <p className="text-red-500 text-sm mt-1">{errors.promptpayId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อใน PromptPay *
              </label>
              <input
                {...register('promptpayName')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="ชื่อ-นามสกุล"
              />
              {errors.promptpayName && (
                <p className="text-red-500 text-sm mt-1">{errors.promptpayName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL รูปภาพ Selfie (ไม่บังคับ)
              </label>
              <input
                {...register('selfieUrl')}
                type="url"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/selfie.jpg"
              />
              {errors.selfieUrl && (
                <p className="text-red-500 text-sm mt-1">{errors.selfieUrl.message}</p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                ⚠️ หมายเหตุ: ระบบจะตรวจสอบข้อมูลและอนุมัติภายใน 24-48 ชั่วโมง
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'กำลังส่ง...' : 'ส่งข้อมูล'}
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
