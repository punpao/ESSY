import { test, expect } from '@playwright/test';

const API = process.env.API_BASE_URL ?? 'http://localhost:4000/api/v1';

const loginViaOtp = async (request: any, email: string) => {
  const req = await request.post(`${API}/auth/email/request`, { data: { email } });
  expect(req.ok()).toBeTruthy();
  const { debugCode } = await req.json();
  const verify = await request.post(`${API}/auth/email/verify`, { data: { email, code: debugCode } });
  expect(verify.ok()).toBeTruthy();
  const body = await verify.json();
  return body.token as string;
};

test('seller to buyer happy path and dispute refund', async ({ request }) => {
  const sellerToken = await loginViaOtp(request, 'seller@escrow.local');
  const buyerToken = await loginViaOtp(request, 'buyer@escrow.local');
  const adminToken = await loginViaOtp(request, 'ops@escrow.local');

  // Seller creates a deal
  const createDeal = await request.post(`${API}/deals`, {
    data: { title: 'Playwright Camera', amountThb: 1999 },
    headers: { Authorization: `Bearer ${sellerToken}` },
  });
  expect(createDeal.ok()).toBeTruthy();
  const dealPayload = await createDeal.json();
  const dealId = dealPayload.deal.id as string;

  // Buyer creates payment and webhook marks paid
  const chargeRes = await request.post(`${API}/payments/create`, {
    data: { dealId },
    headers: { Authorization: `Bearer ${buyerToken}` },
  });
  expect(chargeRes.ok()).toBeTruthy();
  const charge = await chargeRes.json();

  const webhook = await request.post(`${API}/payments/webhook/mock`, {
    data: {
      providerRef: charge.providerRef,
      status: 'PAID',
      dealId,
      amountSatang: dealPayload.deal.amountSatang,
    },
  });
  expect(webhook.ok()).toBeTruthy();

  let dealRes = await request.get(`${API}/deals/${dealId}`, {
    headers: { Authorization: `Bearer ${sellerToken}` },
  });
  expect(dealRes.ok()).toBeTruthy();
  let deal = await dealRes.json();
  expect(deal.status).toBe('HOLD');

  // Seller ships
  await request.post(`${API}/deals/${dealId}/ship`, {
    data: { trackingNumber: 'TH9876543210', courier: 'Flash' },
    headers: { Authorization: `Bearer ${sellerToken}` },
  });

  // Buyer confirms receipt
  await request.post(`${API}/deals/${dealId}/confirm`, {
    headers: { Authorization: `Bearer ${buyerToken}` },
  });

  dealRes = await request.get(`${API}/deals/${dealId}`, {
    headers: { Authorization: `Bearer ${sellerToken}` },
  });
  deal = await dealRes.json();
  expect(deal.status).toBe('RELEASED');

  // Create another deal to test dispute + refund
  const disputeDealRes = await request.post(`${API}/deals`, {
    data: { title: 'Playwright Shoes', amountThb: 2500 },
    headers: { Authorization: `Bearer ${sellerToken}` },
  });
  const disputeDealPayload = await disputeDealRes.json();
  const disputeDealId = disputeDealPayload.deal.id as string;

  const disputeChargeRes = await request.post(`${API}/payments/create`, {
    data: { dealId: disputeDealId },
    headers: { Authorization: `Bearer ${buyerToken}` },
  });
  const disputeCharge = await disputeChargeRes.json();

  await request.post(`${API}/payments/webhook/mock`, {
    data: {
      providerRef: disputeCharge.providerRef,
      status: 'PAID',
      dealId: disputeDealId,
      amountSatang: disputeDealPayload.deal.amountSatang,
    },
  });

  // Buyer opens dispute
  const openDispute = await request.post(`${API}/disputes/${disputeDealId}/open`, {
    data: { dealId: disputeDealId, reason: 'not_as_described' },
    headers: { Authorization: `Bearer ${buyerToken}` },
  });
  expect(openDispute.ok()).toBeTruthy();
  const openDisputePayload = await openDispute.json();
  const disputeId = openDisputePayload.dispute.id as string;

  // Admin resolves refund
  await request.post(`${API}/disputes/${disputeId}/resolve`, {
    data: { resolution: 'refund', note: 'Approve refund' },
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  await request.post(`${API}/payments/${disputeDealId}/refund`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  const disputeDealCheck = await request.get(`${API}/deals/${disputeDealId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const disputeDeal = await disputeDealCheck.json();
  expect(disputeDeal.status).toBe('REFUND');
});
