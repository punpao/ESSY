'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Shield, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';

export default function PaymentPage() {
  const params = useParams();
  const token = params.token as string;
  const [deal, setDeal] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'init' | 'paid'>('init');
  const { toast } = useToast();

  useEffect(() => {
    loadDeal();
  }, [token]);

  const loadDeal = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/deals/paylink/${token}`
      );
      if (!res.ok) throw new Error('Deal not found');
      const data = await res.json();
      setDeal(data);

      // Check if already paid
      if (data.payments && data.payments.length > 0) {
        setPaymentStatus('paid');
      }
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่พบรายการนี้',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/payments/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paylinkToken: token }),
      });

      if (!res.ok) throw new Error('Failed to create payment');
      const { qrCode: qr } = await res.json();
      setQrCode(qr);
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถสร้าง QR Code ได้',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMockPayment = async () => {
    if (!deal) return;
    setLoading(true);

    try {
      // Get payment
      const payment = deal.payments?.[0] || { providerRef: 'MOCK_REF' };
      
      // Simulate webhook
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/payments/webhook/mock`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerRef: payment.providerRef || `MOCK_PP_${Date.now()}`,
            status: 'paid',
          }),
        }
      );

      if (!res.ok) throw new Error('Payment failed');

      setPaymentStatus('paid');
      toast({
        title: '✅ ชำระเงินสำเร็จ',
        description: 'เงินถูกพักไว้แล้ว จะโอนให้ผู้ขายหลังคุณยืนยันรับของ',
      });

      // Reload deal
      setTimeout(() => loadDeal(), 1000);
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถชำระเงินได้',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !deal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>ไม่พบรายการ</CardTitle>
            <CardDescription>ลิงก์ชำระเงินนี้ไม่ถูกต้องหรือหมดอายุแล้ว</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">SafePay Thailand</h1>
          </div>
          <p className="text-muted-foreground">ชำระเงินแบบปลอดภัย</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{deal.title}</CardTitle>
                <CardDescription className="mt-2">
                  ผู้ขาย: {deal.seller.displayName}
                  {deal.seller.sellerProfile?.verified && (
                    <Badge variant="default" className="ml-2">
                      ✓ ยืนยันตัวตนแล้ว
                    </Badge>
                  )}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(deal.amountSatang)}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {paymentStatus === 'paid' ? (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-800 mb-2">
                  ชำระเงินสำเร็จแล้ว!
                </h3>
                <p className="text-green-700 mb-4">
                  เงินถูกพักไว้กับระบบแล้ว
                  <br />
                  <strong>จะโอนให้ผู้ขายหลังคุณยืนยันรับสินค้า</strong>
                </p>
                <div className="bg-white rounded-lg p-4 mt-4 border border-green-200">
                  <p className="text-sm text-gray-700 mb-2">ขั้นตอนถัดไป:</p>
                  <ol className="text-left text-sm space-y-1 text-gray-600">
                    <li>1. ผู้ขายจะจัดส่งสินค้าและใส่เลขพัสดุ</li>
                    <li>2. คุณรอรับสินค้า</li>
                    <li>3. เมื่อได้รับแล้ว กดยืนยันรับสินค้า</li>
                    <li>4. ระบบจะโอนเงินให้ผู้ขายทันที</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {!qrCode ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-900">
                          <strong>หลักการทำงาน:</strong>
                          <ul className="mt-2 space-y-1">
                            <li>✓ เงินที่คุณโอนจะพักไว้กับระบบ</li>
                            <li>✓ ยังไม่โอนให้ผู้ขายทันที</li>
                            <li>✓ คุณต้องยืนยันรับสินค้าก่อน</li>
                            <li>✓ ถ้าสินค้าไม่ตรงปก เปิดข้อพิพาทได้</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleCreatePayment}
                      className="w-full"
                      size="lg"
                      disabled={loading}
                    >
                      {loading ? 'กำลังโหลด QR Code...' : 'แสดง QR Code เพื่อชำระเงิน'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">สแกน QR เพื่อชำระเงิน</CardTitle>
                  <CardDescription className="text-center">
                    โอนผ่าน PromptPay ทุกธนาคาร
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    {qrCode && (
                      <div className="bg-white p-4 rounded-lg inline-block">
                        <img src={qrCode} alt="QR Code" className="w-64 h-64 mx-auto" />
                      </div>
                    )}

                    <div className="text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 inline mr-1" />
                      QR Code หมดอายุใน 15 นาที
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-900 font-semibold mb-2">
                        สำหรับ MVP Demo:
                      </p>
                      <Button onClick={handleMockPayment} variant="outline" disabled={loading}>
                        {loading ? 'กำลังดำเนินการ...' : 'จำลองการชำระเงิน (Mock Payment)'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>การชำระเงินปลอดภัยด้วย SafePay Thailand</p>
        </div>
      </div>
    </div>
  );
}
