'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@essy/ui';
import { DealStatusBadge } from '@/components/DealStatusBadge';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface PaylinkData {
  deal: {
    id: string;
    title: string;
    amountSatang: number;
    currency: string;
    status: string;
    seller: {
      displayName: string;
      verified: boolean;
      promptpayName?: string;
    };
  };
  payment: {
    status: string;
    providerRef: string;
  } | null;
  qrString: string | null;
}

export default function PaylinkPage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<PaylinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/paylink/${token}`)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setPaid(data.payment?.status === 'PAID');
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);

  const handleMockPayment = async () => {
    if (!data) return;

    // Simulate payment webhook
    await fetch(`${API_URL}/api/v1/payments/webhook/mock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dealId: data.deal.id,
        providerRef: data.payment?.providerRef || `MOCK_${data.deal.id}`,
      }),
    });

    setPaid(true);
    // Refresh data
    const res = await fetch(`${API_URL}/api/v1/paylink/${token}`);
    const newData = await res.json();
    setData(newData);
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-16 text-center">กำลังโหลด...</div>;
  }

  if (!data) {
    return <div className="container mx-auto px-4 py-16 text-center">ไม่พบ Paylink</div>;
  }

  const amountTHB = (data.deal.amountSatang / 100).toLocaleString('th-TH');

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">ชำระเงิน</h1>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{data.deal.title}</h2>
            <p className="text-2xl font-bold text-blue-600">{amountTHB} บาท</p>
            <div className="mt-2">
              <DealStatusBadge status={data.deal.status as any} />
            </div>
          </div>

          <div className="mb-6 p-4 bg-gray-100 rounded-lg">
            <p className="font-semibold mb-2">ผู้ขาย: {data.deal.seller.displayName}</p>
            {data.deal.seller.verified && (
              <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                ✅ ผู้ขายยืนยันตัวตน
              </span>
            )}
            {data.deal.seller.promptpayName && (
              <p className="text-sm text-gray-600 mt-1">
                PromptPay: {data.deal.seller.promptpayName}
              </p>
            )}
          </div>

          {!paid ? (
            <>
              {data.qrString && (
                <div className="mb-6 text-center">
                  <div className="inline-block p-4 bg-white border-2 border-gray-300 rounded-lg">
                    <div className="w-64 h-64 bg-gray-200 flex items-center justify-center">
                      <p className="text-gray-500">QR Code</p>
                      <p className="text-xs text-gray-400 ml-2">{data.qrString.substring(0, 20)}...</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    สแกน QR Code ด้วยแอปธนาคารของคุณ
                  </p>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm font-semibold text-yellow-800 mb-2">
                  ⚠️ สิ่งสำคัญที่ต้องรู้:
                </p>
                <p className="text-sm text-yellow-700">
                  เงินยังไม่เข้าผู้ขาย จนกว่าคุณจะกดยืนยันรับของ หรือระบบเห็นว่า 'จัดส่งสำเร็จ' แล้ว
                </p>
              </div>

              <Button onClick={handleMockPayment} className="w-full" size="lg">
                อัปสลิป (Mock Payment)
              </Button>
            </>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <p className="text-lg font-semibold text-green-800 mb-2">
                ✅ ชำระแล้ว
              </p>
              <p className="text-sm text-green-700">
                รอโอนให้ผู้ขายหลังคุณยืนยัน
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
