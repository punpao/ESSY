'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatThaiCurrency } from '@thai-escrow/core';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';
import Image from 'next/image';

export default function PaymentPage() {
  const params = useParams();
  const token = params.token as string;

  const [deal, setDeal] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDeal();
  }, [token]);

  const loadDeal = async () => {
    const result = await api.getDealByToken(token);
    if (result.error) {
      setError(result.error);
    } else {
      setDeal(result.data);
      if (result.data.has_payment) {
        setPaid(true);
      }
    }
    setLoading(false);
  };

  const handleRequestQR = async () => {
    setPaying(true);
    const result = await api.createPayment(deal.id);
    if (result.error) {
      setError(result.error);
    } else {
      setPayment(result.data.payment);
      setQrDataUrl(result.data.qrDataUrl);
    }
    setPaying(false);
  };

  const handleMockPayment = async () => {
    if (!payment) return;

    const confirmed = confirm('ทดสอบการชำระเงิน?\n(นี่คือ mock webhook สำหรับ demo)');
    if (!confirmed) return;

    const result = await api.mockPaymentWebhook({
      event: 'payment.success',
      providerRef: payment.provider_ref,
      status: 'PAID',
      paidAt: new Date().toISOString(),
    });

    if (result.error) {
      setError(result.error);
    } else {
      setPaid(true);
      alert('ชำระเงินสำเร็จ! เงินพักไว้แล้ว');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>กำลังโหลด...</p>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">ไม่พบ Paylink</h1>
          <p className="text-gray-600 mb-6">{error || 'ลิงก์นี้ไม่ถูกต้องหรือหมดอายุแล้ว'}</p>
          <Link href="/" className="text-blue-600 hover:underline">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  if (paid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">ชำระเงินแล้ว!</h1>
          <p className="text-gray-600 mb-2">
            เงิน <strong className="text-blue-600">{formatThaiCurrency(deal.amount_satang)}</strong>
          </p>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-6 text-left">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ สำคัญ:</strong> เงินยังไม่เข้าผู้ขาย<br />
              พักไว้ที่ Thai Escrow จนกว่าคุณจะยืนยันรับสินค้า
            </p>
          </div>
          <p className="text-sm text-gray-600">
            คุณสามารถติดตามสถานะได้ที่เมนูผู้ซื้อ
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-bold">Thai Escrow</span>
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Deal Info */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">{deal.title}</h1>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">ราคา</p>
                <p className="text-3xl font-bold text-blue-600">
                  {formatThaiCurrency(deal.amount_satang)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">ผู้ขาย</p>
                <p className="font-semibold">{deal.seller.display_name}</p>
                {deal.seller.verified && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    ✓ Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Warning Box */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
            <h3 className="font-semibold text-blue-900 mb-2">
              🛡️ ระบบพักเงินปลอดภัย
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ เงินยังไม่เข้าผู้ขายทันที</li>
              <li>✓ พักไว้ที่ Thai Escrow จนกว่าคุณจะยืนยันรับสินค้า</li>
              <li>✓ ถ้ามีปัญหา สามารถเปิดข้อพิพาทได้</li>
            </ul>
          </div>

          {/* QR Code or Button */}
          {!qrDataUrl ? (
            <button
              onClick={handleRequestQR}
              disabled={paying}
              className="w-full px-6 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 text-lg"
            >
              {paying ? 'กำลังโหลด...' : 'แสดง QR Code ชำระเงิน'}
            </button>
          ) : (
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-4">สแกน QR เพื่อชำระเงิน</h3>
              <div className="bg-white p-4 inline-block rounded-lg border-2 border-gray-200 mb-4">
                {qrDataUrl && (
                  <img src={qrDataUrl} alt="PromptPay QR" className="w-64 h-64 mx-auto" />
                )}
              </div>
              <p className="text-sm text-gray-600 mb-6">
                สแกนด้วยแอปธนาคารของคุณ (PromptPay)
              </p>

              {/* Mock Payment Button (for demo) */}
              <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-yellow-800 mb-3">
                  <strong>สำหรับ Demo:</strong> จำลองการชำระเงิน
                </p>
                <button
                  onClick={handleMockPayment}
                  className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
                >
                  จำลองชำระเงิน (Mock)
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
