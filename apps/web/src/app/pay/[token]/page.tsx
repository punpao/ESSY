'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@essy/ui';

interface Deal {
  id: string;
  title: string;
  amount_satang: number;
  currency: string;
  seller: {
    display_name: string;
    seller_profile?: {
      verified: boolean;
      promptpay_name: string;
    };
  };
  payment?: {
    status: string;
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
    fetchDeal();
  }, [token]);

  async function fetchDeal() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/deals/paylink/${token}`
      );
      const data = await res.json();
      setDeal(data);

      if (data.payment?.status === 'PAID') {
        setPaid(true);
      } else if (data.id) {
        // Create payment charge
        const chargeRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/payments/create`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deal_id: data.id }),
          }
        );
        const charge = await chargeRes.json();
        setQrString(charge.qr_string);
      }
    } catch (error) {
      console.error('Error fetching deal:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMockPayment() {
    if (!deal || !qrString) return;

    try {
      // Get provider_ref from deal payment
      const dealRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/deals/paylink/${token}`
      );
      const dealData = await dealRes.json();
      const providerRef = dealData.payment?.provider_ref || 'mock_ref';

      // Simulate webhook callback
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/payments/webhook/mock`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider_ref: providerRef,
            signature: 'mock_secret',
          }),
        }
      );

      if (res.ok) {
        setPaid(true);
        // Refresh deal
        await fetchDeal();
      }
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">กำลังโหลด...</div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">ไม่พบรายการ</div>
      </div>
    );
  }

  const amountBaht = (deal.amount_satang / 100).toLocaleString('th-TH');

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">ชำระเงิน</h1>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">{deal.title}</h2>
              <p className="text-gray-600">
                ผู้ขาย: {deal.seller.display_name}
                {deal.seller.seller_profile?.verified && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
                    ✓ Verified Seller
                  </span>
                )}
              </p>
            </div>

            <div className="border-t pt-6">
              <div className="flex justify-between text-2xl font-bold mb-4">
                <span>จำนวนเงิน</span>
                <span>{amountBaht} บาท</span>
              </div>

              {paid ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <div className="text-green-800 font-semibold text-lg mb-2">
                    ✓ ชำระแล้ว
                  </div>
                  <p className="text-green-700 text-sm">
                    รอโอนให้ผู้ขายหลังคุณยืนยันรับของ หรือระบบเห็นว่า
                    &quot;จัดส่งสำเร็จ&quot; แล้ว
                  </p>
                  <p className="text-gray-600 text-xs mt-2">
                    เงินยังไม่เข้าผู้ขาย จนกว่าคุณจะกดยืนยันรับของ
                  </p>
                </div>
              ) : (
                <div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
                    <p className="text-blue-800 font-semibold mb-2">
                      สแกน QR Code เพื่อชำระเงินผ่าน PromptPay
                    </p>
                    {qrString && (
                      <div className="bg-white p-4 rounded inline-block">
                        {/* Mock QR - in production, use qrcode library */}
                        <div className="w-64 h-64 bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-400">
                          <div className="text-center text-gray-500">
                            <div className="text-sm mb-2">QR Code</div>
                            <div className="text-xs">{qrString.substring(0, 30)}...</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleMockPayment}
                    className="w-full"
                    size="lg"
                  >
                    อัปสลิป (Mock - สำหรับทดสอบ)
                  </Button>

                  <p className="text-xs text-gray-500 mt-4 text-center">
                    หมายเหตุ: เงินยังไม่เข้าผู้ขาย จนกว่าคุณจะกดยืนยันรับของ
                    หรือระบบเห็นว่า &quot;จัดส่งสำเร็จ&quot; แล้ว
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
