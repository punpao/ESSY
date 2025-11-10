'use client';

import { useState } from 'react';
import { Button } from '@essy/ui';

export default function KYCPage() {
  const [formData, setFormData] = useState({
    promptpay_id: '',
    promptpay_name: '',
    selfie_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/seller/verify/basic`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer mock_token`,
          },
          body: JSON.stringify({
            promptpay_id: formData.promptpay_id,
            promptpay_name: formData.promptpay_name,
            selfie_url: formData.selfie_url || undefined,
          }),
        }
      );

      if (res.ok) {
        setSubmitted(true);
      } else {
        alert('เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error submitting KYC:', error);
      alert('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold mb-4">ส่งข้อมูลเรียบร้อย</h1>
          <p className="text-gray-600 mb-6">
            ข้อมูลของคุณกำลังรอการตรวจสอบจากทีมงาน
            จะแจ้งผลภายใน 24-48 ชั่วโมง
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">ยืนยันตัวตนผู้ขาย</h1>
          <p className="text-gray-600 mb-6">
            กรุณากรอกข้อมูลเพื่อยืนยันตัวตนและรับ Verified Seller badge
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                เลข PromptPay (เบอร์โทรศัพท์หรือเลขบัญชี) *
              </label>
              <input
                type="text"
                required
                value={formData.promptpay_id}
                onChange={(e) =>
                  setFormData({ ...formData, promptpay_id: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="0812345678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                ชื่อที่แสดงใน PromptPay *
              </label>
              <input
                type="text"
                required
                value={formData.promptpay_name}
                onChange={(e) =>
                  setFormData({ ...formData, promptpay_name: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="ชื่อ-นามสกุล"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                URL รูปภาพ Selfie (Mock - สำหรับทดสอบ)
              </label>
              <input
                type="url"
                value={formData.selfie_url}
                onChange={(e) =>
                  setFormData({ ...formData, selfie_url: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="https://example.com/selfie.jpg"
              />
              <p className="text-xs text-gray-500 mt-1">
                ในระบบจริง จะมีการอัปโหลดรูปภาพและตรวจสอบ Liveness
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? 'กำลังส่ง...' : 'ส่งข้อมูลยืนยันตัวตน'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
