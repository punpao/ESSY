'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';

interface Deal {
  id: string;
  title: string;
  amountSatang: number;
  status: string;
  seller: {
    displayName: string;
    sellerProfile?: {
      verified: boolean;
      promptpayName: string;
    };
  };
  payment?: {
    status: string;
    providerRef: string;
  };
}

export default function PayPage() {
  const params = useParams();
  const token = params.token as string;
  const [deal, setDeal] = useState<Deal | null>(null);
  const [qrString, setQrString] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    // Fetch deal by paylink token
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/deals/paylink/${token}`)
      .then((res) => res.json())
      .then((data) => {
        setDeal(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch deal', error);
        setLoading(false);
      });
  }, [token]);

  const handleCreatePayment = async () => {
    if (!deal) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/payments/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: deal.id }),
      });

      const data = await res.json();
      setQrString(data.qrString);
    } catch (error) {
      console.error('Failed to create payment', error);
    }
  };

  const handleMockPayment = async () => {
    if (!deal || !qrString) return;

    try {
      // Simulate webhook callback
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/payments/webhook/mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerRef: 'MOCK_' + Date.now(),
          status: 'PAID',
        }),
      });

      setPaid(true);
      if (deal) {
        setDeal({ ...deal, status: 'HOLD' });
      }
    } catch (error) {
      console.error('Failed to process payment', error);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-16 text-center">กำลังโหลด...</div>;
  }

  if (!deal) {
    return <div className="container mx-auto px-4 py-16 text-center">ไม่พบ Paylink</div>;
  }

  const amountBaht = (deal.amountSatang / 100).toLocaleString('th-TH');

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{deal.title}</CardTitle>
            <CardDescription>
              จาก {deal.seller.displayName}
              {deal.seller.sellerProfile?.verified && (
                <Badge className="ml-2" variant="default">
                  ✅ Verified Seller
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">จำนวนเงิน</span>
              <span className="text-2xl font-bold text-primary">{amountBaht} บาท</span>
            </div>

            <div>
              <StatusBadge status={deal.status as any} />
            </div>

            {deal.status === 'PENDING' && !qrString && (
              <Button onClick={handleCreatePayment} className="w-full" size="lg">
                สร้าง QR Code สำหรับชำระเงิน
              </Button>
            )}

            {qrString && !paid && (
              <div className="space-y-4">
                <div className="bg-white p-8 rounded-lg border-2 border-dashed border-gray-300 text-center">
                  <div className="text-sm text-gray-600 mb-4">สแกน QR Code นี้เพื่อชำระเงิน</div>
                  <div className="bg-white p-4 inline-block rounded">
                    {/* Mock QR - in production, use a QR code library */}
                    <div className="w-64 h-64 bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                      QR Code
                      <br />
                      {qrString.substring(0, 20)}...
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-900 font-semibold mb-2">
                    ⚠️ สำคัญ: เงินยังไม่เข้าผู้ขาย
                  </p>
                  <p className="text-sm text-blue-800">
                    เงินจะถูกพักไว้ในระบบ จนกว่าคุณจะกดยืนยันรับของ หรือระบบเห็นว่า 'จัดส่งสำเร็จ' แล้ว
                  </p>
                </div>

                <Button onClick={handleMockPayment} className="w-full" size="lg" variant="outline">
                  อัปสลิป (Mock - สำหรับทดสอบ)
                </Button>
              </div>
            )}

            {paid && (
              <div className="bg-green-50 p-6 rounded-lg text-center">
                <div className="text-2xl mb-2">✅</div>
                <p className="text-lg font-semibold text-green-900 mb-2">ชำระแล้ว</p>
                <p className="text-sm text-green-800">
                  รอโอนให้ผู้ขายหลังคุณยืนยันรับของ
                </p>
              </div>
            )}

            {deal.seller.sellerProfile?.promptpayName && (
              <div className="text-sm text-gray-600 pt-4 border-t">
                PromptPay: {deal.seller.sellerProfile.promptpayName} ({deal.seller.sellerProfile.promptpayName})
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
