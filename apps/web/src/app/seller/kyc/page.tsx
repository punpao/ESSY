'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function KYCPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    promptpayId: '',
    promptpayName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/seller/verify/basic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit KYC', error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardContent className="py-16 text-center">
              <div className="text-4xl mb-4">✅</div>
              <h2 className="text-2xl font-bold mb-4">ส่งข้อมูลแล้ว</h2>
              <p className="text-gray-600 mb-6">
                ข้อมูลของคุณกำลังรอการตรวจสอบจากทีมงาน
              </p>
              <Badge variant="secondary">สถานะ: รอการตรวจสอบ</Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>ยืนยันตัวตนผู้ขาย</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="promptpayId">หมายเลข PromptPay (10 หลัก)</Label>
                <Input
                  id="promptpayId"
                  value={formData.promptpayId}
                  onChange={(e) => setFormData({ ...formData, promptpayId: e.target.value })}
                  required
                  maxLength={10}
                  placeholder="0812345678"
                />
              </div>

              <div>
                <Label htmlFor="promptpayName">ชื่อที่แสดงใน PromptPay</Label>
                <Input
                  id="promptpayName"
                  value={formData.promptpayName}
                  onChange={(e) => setFormData({ ...formData, promptpayName: e.target.value })}
                  required
                  placeholder="ชื่อของคุณ"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-900 font-semibold mb-2">
                  📸 อัปโหลดรูปเซลฟี่
                </p>
                <p className="text-sm text-blue-800">
                  (Mock: ในเวอร์ชันจริงจะมีการอัปโหลดรูปเซลฟี่เพื่อยืนยันตัวตน)
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'กำลังส่ง...' : 'ส่งข้อมูล'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
