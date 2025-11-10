'use client';

import { useState, useTransition } from 'react';
import { Button, Card, CardBody, CardHeader } from '@thai-escrow/ui';
import { apiFetch } from '../../../lib/apiClient';
import { triggerMockPayment } from './actions';

interface PromptPayWidgetProps {
  dealId: string;
  paylinkToken: string;
  amountSatang: number;
}

interface PaymentChargeResponse {
  qrString: string;
  providerRef: string;
  amountSatang: number;
}

export const PromptPayWidget = ({
  dealId,
  paylinkToken,
  amountSatang
}: PromptPayWidgetProps) => {
  const [charge, setCharge] = useState<PaymentChargeResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [payerEmail, setPayerEmail] = useState('buyer@socialtrust.th');
  const [loading, setLoading] = useState(false);

  const requestQr = async () => {
    try {
      setLoading(true);
      const response = await apiFetch<PaymentChargeResponse>('/payments/create', {
        method: 'POST',
        body: {
          paylinkToken,
          payerEmail
        }
      });
      setCharge(response);
      setStatusMessage(
        'สแกน QR ผ่านแอปธนาคาร แล้วกด “แจ้งว่าโอนแล้ว” เพื่อให้ระบบพักเงิน (HOLD)'
      );
    } catch (error: any) {
      setStatusMessage(error.message ?? 'ไม่สามารถสร้าง QR ได้');
    } finally {
      setLoading(false);
    }
  };

  const sendMockWebhook = async () => {
    if (!charge) return;
    startTransition(async () => {
      setStatusMessage('กำลังแจ้งชำระเงินให้ระบบ...');
      try {
        await triggerMockPayment({
          dealId,
          providerRef: charge.providerRef,
          payerEmail
        });
        setStatusMessage('ชำระเงินแล้ว เงินถูกพักไว้ (HOLD) รอผู้ขายจัดส่ง');
      } catch (error: any) {
        setStatusMessage(error.message ?? 'ไม่สามารถแจ้งชำระเงินได้');
      }
    });
  };

  const amountTHB = (amountSatang / 100).toFixed(2);

  return (
    <Card>
      <CardHeader
        title="ชำระเงินผ่าน PromptPay"
        description="เงินยังไม่เข้าผู้ขาย จนกว่าคุณจะกดยืนยันรับของ หรือระบบเห็นว่า “จัดส่งสำเร็จ” แล้ว"
      />
      <CardBody className="flex flex-col gap-4">
        <label className="text-sm font-medium text-slate-700">
          อีเมลสำหรับยืนยัน (จำลอง)
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={payerEmail}
            onChange={(event) => setPayerEmail(event.target.value)}
          />
        </label>

        <Button onClick={requestQr} disabled={loading}>
          ขอ QR PromptPay {amountTHB} บาท
        </Button>

        {charge ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left text-sm">
            <p className="font-semibold text-slate-800">QR Content (จำลอง):</p>
            <code className="mt-2 block break-words rounded bg-white p-2 text-xs text-slate-700">
              {charge.qrString}
            </code>
            <p className="mt-3 text-xs text-slate-500">
              อัปโหลดสลิป (จำลอง) เพื่อให้ระบบพักเงินก่อนโอนไปยังผู้ขาย
            </p>
            <Button
              variant="secondary"
              className="mt-3"
              onClick={sendMockWebhook}
              disabled={isPending}
            >
              แจ้งว่าโอนแล้ว (จำลอง)
            </Button>
          </div>
        ) : null}

        {statusMessage ? <p className="text-sm text-blue-600">{statusMessage}</p> : null}
      </CardBody>
    </Card>
  );
};
