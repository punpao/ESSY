'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function DisputePage() {
  const params = useParams();
  const dealId = params.id as string;
  const [reason, setReason] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>(['']);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/disputes/${dealId}/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reasonText: `${reason}: ${reasonText}`,
        }),
      });

      // Add evidence
      for (const url of evidenceUrls.filter(Boolean)) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/disputes/${dealId}/evidence`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            kind: 'image',
          }),
        });
      }

      alert('เปิดข้อพิพาทสำเร็จ');
    } catch (error) {
      console.error('Failed to open dispute', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>เปิดข้อพิพาท</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label>สาเหตุ</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสาเหตุ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_received">ของยังไม่ถึง</SelectItem>
                    <SelectItem value="not_as_described">ของไม่ตรงปก</SelectItem>
                    <SelectItem value="other">อื่น ๆ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="details">รายละเอียด</Label>
                <Textarea
                  id="details"
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  required
                  placeholder="อธิบายปัญหา..."
                  rows={4}
                />
              </div>

              <div>
                <Label>หลักฐาน (URL รูปภาพหรือไฟล์)</Label>
                {evidenceUrls.map((url, idx) => (
                  <Input
                    key={idx}
                    type="url"
                    value={url}
                    onChange={(e) => {
                      const newUrls = [...evidenceUrls];
                      newUrls[idx] = e.target.value;
                      setEvidenceUrls(newUrls);
                    }}
                    placeholder="https://..."
                    className="mb-2"
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEvidenceUrls([...evidenceUrls, ''])}
                >
                  เพิ่มหลักฐาน
                </Button>
              </div>

              <Button type="submit" className="w-full">
                ส่งข้อพิพาท
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
