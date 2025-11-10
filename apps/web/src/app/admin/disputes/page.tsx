'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';

interface Dispute {
  id: string;
  status: string;
  reasonText: string;
  createdAt: string;
  deal: {
    title: string;
    amountSatang: number;
  };
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data
    setTimeout(() => {
      setDisputes([
        {
          id: 'dispute-1',
          status: 'OPEN',
          reasonText: 'ของไม่ตรงปก',
          createdAt: new Date().toISOString(),
          deal: {
            title: 'AirPods Pro 2',
            amountSatang: 800000,
          },
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">จัดการข้อพิพาท</h1>

        {loading ? (
          <div className="text-center py-16">กำลังโหลด...</div>
        ) : disputes.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-gray-600">ไม่มีข้อพิพาท</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <Card key={dispute.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{dispute.deal.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {(dispute.deal.amountSatang / 100).toLocaleString('th-TH')} บาท
                      </p>
                    </div>
                    <StatusBadge status={dispute.status as any} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">{dispute.reasonText}</p>
                  <div className="flex gap-2">
                    <Badge variant="destructive">คืนเงิน</Badge>
                    <Badge variant="default">โอนเงิน</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
