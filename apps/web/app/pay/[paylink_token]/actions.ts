'use server';

import crypto from 'crypto';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';
const PAYMENT_WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET ?? 'mock_secret';

export async function triggerMockPayment(params: {
  dealId: string;
  providerRef: string;
  payerEmail: string;
}) {
  const payload = {
    dealId: params.dealId,
    providerRef: params.providerRef,
    payerEmail: params.payerEmail
  };
  const signature = crypto
    .createHmac('sha256', PAYMENT_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  const res = await fetch(`${API_BASE_URL}/payments/webhook/mock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-mock-signature': signature
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Webhook failed: ${text}`);
  }
}
