'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function NewDealPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amountSatang: '',
    buyerNote: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In production, call API
      const amountSatang = Math.round(parseFloat(formData.amountSatang) * 100);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/deals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          amountSatang,
          buyerNote: formData.buyerNote,
        }),
      });

      const data = await res.json();
      router.push(`/seller/dashboard`);
    } catch (error) {
      console.error('Failed to create deal', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>สร้าง Paylink ใหม่</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">ชื่อสินค้า</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="เช่น iPhone 13 Pro Max 256GB"
                />
              </div>

              <div>
                <Label htmlFor="amount">ราคา (บาท)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amountSatang}
                  onChange={(e) => setFormData({ ...formData, amountSatang: e.target.value })}
                  required
                  placeholder="35000"
                />
              </div>

              <div>
                <Label htmlFor="note">หมายเหตุสำหรับผู้ซื้อ (ไม่บังคับ)</Label>
                <Textarea
                  id="note"
                  value={formData.buyerNote}
                  onChange={(e) => setFormData({ ...formData, buyerNote: e.target.value })}
                  placeholder="เช่น สภาพดีมาก ใช้งานได้ปกติ"
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'กำลังสร้าง...' : 'สร้าง Paylink'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
