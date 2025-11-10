import { test, expect, request } from '@playwright/test';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {
  SEED_ADMIN_ID,
  SEED_BUYER_ID,
  SEED_SELLER_ID
} from '../../api/prisma/seed-ids';

const API_PREFIX = '/api/v1';
const JWT_SECRET = process.env.JWT_SECRET ?? 'change_me';
const PAYMENT_WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET ?? 'mock_secret';

const signToken = (id: string, role: 'buyer' | 'seller' | 'admin') =>
  jwt.sign({ id, role }, JWT_SECRET);

const buildHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
});

const triggerPaymentWebhook = async (
  api: request.APIRequestContext,
  dealId: string,
  providerRef: string,
  payerEmail: string
) => {
  const payload = {
    dealId,
    providerRef,
    payerEmail
  };
  const signature = crypto
    .createHmac('sha256', PAYMENT_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  const res = await api.post(`${API_PREFIX}/payments/webhook/mock`, {
    data: payload,
    headers: {
      'x-mock-signature': signature,
      'Content-Type': 'application/json'
    }
  });
  expect(res.ok()).toBeTruthy();
};

test.describe('Social escrow business flow', () => {
  test('seller creates paylink and payment moves deal to HOLD then RELEASED', async ({ playwright }) => {
    const api = await playwright.request.newContext({
      baseURL: process.env.API_BASE_URL ?? 'http://localhost:4000'
    });
    const sellerToken = signToken(SEED_SELLER_ID, 'seller');
    const buyerToken = signToken(SEED_BUYER_ID, 'buyer');

    const dealRes = await api.post(`${API_PREFIX}/deals`, {
      data: {
        title: `รองเท้า Yeezy มือสอง ${Date.now()}`,
        amountTHB: 4500,
        buyerEmail: 'buyer@socialtrust.th'
      },
      headers: buildHeaders(sellerToken)
    });
    expect(dealRes.ok()).toBeTruthy();
    const dealPayload = await dealRes.json();
    expect(dealPayload.paylinkUrl).toContain('/pay/');
    const dealId = dealPayload.deal.id;
    const paylinkToken = dealPayload.deal.paylinkToken;

    const paymentInit = await api.post(`${API_PREFIX}/payments/create`, {
      data: {
        paylinkToken,
        payerEmail: 'buyer@socialtrust.th'
      }
    });
    expect(paymentInit.ok()).toBeTruthy();
    const paymentBody = await paymentInit.json();

    await triggerPaymentWebhook(api, dealId, paymentBody.providerRef, 'buyer@socialtrust.th');

    const holdDealRes = await api.get(`${API_PREFIX}/deals/${dealId}`, {
      headers: buildHeaders(sellerToken)
    });
    const holdDeal = await holdDealRes.json();
    expect(holdDeal.deal.status).toBe('HOLD');

    const shipRes = await api.post(`${API_PREFIX}/deals/${dealId}/ship`, {
      data: {
        trackingNumber: 'KERRY1234567',
        courier: 'Kerry'
      },
      headers: buildHeaders(sellerToken)
    });
    expect(shipRes.ok()).toBeTruthy();

    const confirmRes = await api.post(`${API_PREFIX}/deals/${dealId}/confirm`, {
      headers: buildHeaders(buyerToken)
    });
    expect(confirmRes.ok()).toBeTruthy();
    const confirmPayload = await confirmRes.json();
    expect(confirmPayload.deal.status).toBe('RELEASED');
  });

  test('dispute escalation and admin refund', async ({ playwright }) => {
    const api = await playwright.request.newContext({
      baseURL: process.env.API_BASE_URL ?? 'http://localhost:4000'
    });

    const sellerToken = signToken(SEED_SELLER_ID, 'seller');
    const buyerToken = signToken(SEED_BUYER_ID, 'buyer');
    const adminToken = signToken(SEED_ADMIN_ID, 'admin');

    const dealRes = await api.post(`${API_PREFIX}/deals`, {
      data: {
        title: `เกมคอนโซลมือสอง ${Date.now()}`,
        amountTHB: 7500,
        buyerEmail: 'buyer@socialtrust.th'
      },
      headers: buildHeaders(sellerToken)
    });
    const { deal } = await dealRes.json();

    const paymentInit = await api.post(`${API_PREFIX}/payments/create`, {
      data: {
        paylinkToken: deal.paylinkToken,
        payerEmail: 'buyer@socialtrust.th'
      }
    });
    const paymentBody = await paymentInit.json();
    await triggerPaymentWebhook(api, deal.id, paymentBody.providerRef, 'buyer@socialtrust.th');

    await api.post(`${API_PREFIX}/deals/${deal.id}/ship`, {
      data: {
        trackingNumber: 'FLASH987654',
        courier: 'Flash',
        delivered: false
      },
      headers: buildHeaders(sellerToken)
    });

    const disputeOpenRes = await api.post(`${API_PREFIX}/disputes/${deal.id}/open`, {
      data: {
        reason: 'ของไม่ตรงปก'
      },
      headers: buildHeaders(buyerToken)
    });
    expect(disputeOpenRes.ok()).toBeTruthy();

    const adminDisputes = await api.get(`${API_PREFIX}/admin/disputes?status=OPEN`, {
      headers: buildHeaders(adminToken)
    });
    const adminList = await adminDisputes.json();
    const disputeRow = adminList.disputes.find((d: any) => d.dealId === deal.id);
    expect(disputeRow).toBeTruthy();
    const disputeId = disputeRow.id as string;

    const resolveRes = await api.post(`${API_PREFIX}/disputes/${disputeId}/resolve`, {
      data: {
        resolution: 'REFUND',
        note: 'คืนเงินให้ผู้ซื้อเพราะของไม่ตรงปก'
      },
      headers: buildHeaders(adminToken)
    });
    expect(resolveRes.ok()).toBeTruthy();

    const dealStatusRes = await api.get(`${API_PREFIX}/deals/${deal.id}`, {
      headers: buildHeaders(adminToken)
    });
    const finalDeal = await dealStatusRes.json();
    expect(finalDeal.deal.status).toBe('REFUND');
  });
});
