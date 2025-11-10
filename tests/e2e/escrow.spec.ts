import { test, expect, APIRequestContext } from '@playwright/test';
import crypto from 'node:crypto';

const API_BASE = process.env.API_BASE ?? 'http://localhost:4000/api/v1';
const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET ?? 'mock_secret';

async function lineLogin(request: APIRequestContext, role: 'buyer' | 'seller' | 'admin', email: string) {
  const res = await request.post(`${API_BASE}/auth/line/callback`, {
    data: {
      code: `mock-${Date.now()}`,
      lineSub: `${role}-${Date.now()}-${Math.random()}`,
      displayName: role.toUpperCase(),
      email,
      role
    }
  });
  expect(res.ok()).toBeTruthy();
  return res.json() as Promise<{ token: string; user: { id: string; email: string } }>;
}

async function authedPost(
  request: APIRequestContext,
  token: string,
  path: string,
  data?: Record<string, unknown>
) {
  const res = await request.post(`${API_BASE}${path}`, {
    data,
    headers: { Authorization: `Bearer ${token}` }
  });
  expect(res.ok()).toBeTruthy();
  return res.json();
}

async function authedGet(request: APIRequestContext, token: string, path: string) {
  const res = await request.get(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  expect(res.ok()).toBeTruthy();
  return res.json();
}

test.describe('Escrow happy paths', () => {
  test('Seller to buyer release flow', async ({ request }) => {
    const seller = await lineLogin(request, 'seller', `seller-${Date.now()}@prompt.local`);
    await authedPost(request, seller.token, '/seller/verify/basic', {
      promptpayId: '0812345678',
      promptpayName: 'Seller Test',
      selfieUrl: 'https://example.com/selfie.jpg'
    });

    const dealRes = await authedPost(request, seller.token, '/deals', {
      title: 'Playwright Flow Item',
      amountThb: 1500
    });
    const dealId = dealRes.deal.id as string;

    const buyer = await lineLogin(request, 'buyer', `buyer-${Date.now()}@prompt.local`);
    const paymentInit = await authedPost(request, buyer.token, '/payments/create', { dealId });

    const payload = {
      provider: 'mock_promptpay',
      providerRef: paymentInit.providerRef,
      dealId,
      status: 'PAID',
      buyerEmail: buyer.user.email ?? `buyer-${Date.now()}@prompt.local`
    };
    const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(JSON.stringify(payload)).digest('hex');
    const webhookRes = await request.post(`${API_BASE}/payments/webhook/mock`, {
      data: payload,
      headers: { 'x-mock-signature': signature }
    });
    expect(webhookRes.ok()).toBeTruthy();

    const holdDeal = await authedGet(request, seller.token, `/deals/${dealId}`);
    expect(holdDeal.deal.status).toBe('HOLD');

    await authedPost(request, seller.token, `/deals/${dealId}/ship`, {
      trackingNumber: 'TH1234567890',
      courier: 'Thailand Post'
    });

    await authedPost(request, buyer.token, `/deals/${dealId}/confirm`);

    const releasedDeal = await authedGet(request, seller.token, `/deals/${dealId}`);
    expect(releasedDeal.deal.status).toBe('RELEASED');
  });

  test('Dispute refund flow', async ({ request }) => {
    const seller = await lineLogin(request, 'seller', `seller-dispute-${Date.now()}@prompt.local`);
    await authedPost(request, seller.token, '/seller/verify/basic', {
      promptpayId: '0898765432',
      promptpayName: 'Seller Dispute',
      selfieUrl: 'https://example.com/selfie2.jpg'
    });

    const dealRes = await authedPost(request, seller.token, '/deals', {
      title: 'Dispute Item',
      amountThb: 2500
    });
    const dealId = dealRes.deal.id as string;

    const buyer = await lineLogin(request, 'buyer', `buyer-dispute-${Date.now()}@prompt.local`);
    const paymentInit = await authedPost(request, buyer.token, '/payments/create', { dealId });
    const payload = {
      provider: 'mock_promptpay',
      providerRef: paymentInit.providerRef,
      dealId,
      status: 'PAID',
      buyerEmail: buyer.user.email ?? `buyer-dispute-${Date.now()}@prompt.local`
    };
    const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(JSON.stringify(payload)).digest('hex');
    await request.post(`${API_BASE}/payments/webhook/mock`, {
      data: payload,
      headers: { 'x-mock-signature': signature }
    });

    await authedPost(request, seller.token, `/deals/${dealId}/ship`, {
      trackingNumber: 'TH0987654321',
      courier: 'Flash Express'
    });

    const disputeRes = await authedPost(request, buyer.token, `/disputes/${dealId}/open`, {
      reason: 'ของไม่ตรงปก',
      detail: 'สีเพี้ยน'
    });

    const admin = await lineLogin(request, 'admin', `admin-${Date.now()}@prompt.local`);
    await authedPost(request, admin.token, `/disputes/${disputeRes.dispute.id}/resolve`, {
      decision: 'RESOLVED_REFUND',
      note: 'หลักฐานชัดเจน คืนเงินเต็มจำนวน'
    });

    const refundedDeal = await authedGet(request, admin.token, `/deals/${dealId}`);
    expect(refundedDeal.deal.status).toBe('REFUND');
  });
});
