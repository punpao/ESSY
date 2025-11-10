import { test, expect, request as playwrightRequest } from "@playwright/test";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";
const PAYMENT_SECRET = process.env.PAYMENT_WEBHOOK_SECRET ?? "mock_secret";

async function emailLogin(ctx: playwrightRequest.APIRequestContext, email: string, role: "buyer" | "seller" | "admin") {
  const otpRes = await ctx.post("/auth/email/request", {
    data: { email }
  });
  expect(otpRes.ok()).toBeTruthy();
  const otpJson = await otpRes.json();

  const verifyRes = await ctx.post("/auth/email/verify", {
    data: { email, code: otpJson.code, role }
  });
  expect(verifyRes.ok()).toBeTruthy();
  return verifyRes.json();
}

test.describe("Escrow happy path", () => {
  test("seller creates paylink → payment hold → ship → buyer releases", async ({ request }) => {
    const ctx = await request.newContext({ baseURL: API_BASE });

    const sellerEmail = `seller+${Date.now()}@test.th`;
    const buyerEmail = `buyer+${Date.now()}@test.th`;

    const sellerAuth = await emailLogin(ctx, sellerEmail, "seller");
    const buyerAuth = await emailLogin(ctx, buyerEmail, "buyer");

    const createDealRes = await ctx.post("/deals", {
      data: { title: "รองเท้ามือสอง adidas", amountTHB: 1250 },
      headers: { Authorization: `Bearer ${sellerAuth.token}` }
    });
    expect(createDealRes.ok()).toBeTruthy();
    const created = await createDealRes.json();
    const dealId = created.deal.id;
    const paylinkToken = created.deal.paylinkToken;

    const chargeRes = await ctx.post("/payments/create", { data: { paylinkToken, buyerEmail } });
    expect(chargeRes.ok()).toBeTruthy();
    const charge = await chargeRes.json();

    const webhookRes = await ctx.post("/payments/webhook/mock", {
      data: {
        secret: PAYMENT_SECRET,
        providerRef: charge.providerRef,
        status: "PAID",
        buyerEmail,
        buyerDisplayName: "คุณบี"
      }
    });
    expect(webhookRes.ok()).toBeTruthy();

    const shipRes = await ctx.post(`/deals/${dealId}/ship`, {
      data: {
        trackingNumber: "TH999999999",
        courier: "Thailand Post"
      },
      headers: { Authorization: `Bearer ${sellerAuth.token}` }
    });
    expect(shipRes.ok()).toBeTruthy();

    const confirmRes = await ctx.post(`/deals/${dealId}/confirm`, {
      headers: { Authorization: `Bearer ${buyerAuth.token}` }
    });
    expect(confirmRes.ok()).toBeTruthy();
    const confirmed = await confirmRes.json();
    expect(confirmed.deal.status).toBe("RELEASED");
  });
});

test.describe("Dispute refund path", () => {
  test("buyer opens dispute → admin refunds", async ({ request }) => {
    const ctx = await request.newContext({ baseURL: API_BASE });

    const sellerEmail = `seller.dispute+${Date.now()}@test.th`;
    const buyerEmail = `buyer.dispute+${Date.now()}@test.th`;

    const sellerAuth = await emailLogin(ctx, sellerEmail, "seller");
    const buyerAuth = await emailLogin(ctx, buyerEmail, "buyer");
    const adminAuth = await emailLogin(ctx, "ops@escrow.th", "admin");

    const dealRes = await ctx.post("/deals", {
      data: { title: "กระเป๋ามือสอง", amountTHB: 2200 },
      headers: { Authorization: `Bearer ${sellerAuth.token}` }
    });
    expect(dealRes.ok()).toBeTruthy();
    const dealJson = await dealRes.json();
    const dealId = dealJson.deal.id;
    const paylinkToken = dealJson.deal.paylinkToken;

    const chargeRes = await ctx.post("/payments/create", {
      data: { paylinkToken, buyerEmail }
    });
    const charge = await chargeRes.json();

    await ctx.post("/payments/webhook/mock", {
      data: {
        secret: PAYMENT_SECRET,
        providerRef: charge.providerRef,
        status: "PAID",
        buyerEmail
      }
    });

    await ctx.post(`/deals/${dealId}/ship`, {
      data: {
        trackingNumber: "KERRY123456",
        courier: "Kerry"
      },
      headers: { Authorization: `Bearer ${sellerAuth.token}` }
    });

    const disputeRes = await ctx.post(`/disputes/${dealId}/open`, {
      data: {
        category: "ของไม่ตรงปก",
        reason: "สีไม่ตรงตามรูป"
      },
      headers: { Authorization: `Bearer ${buyerAuth.token}` }
    });
    expect(disputeRes.ok()).toBeTruthy();
    const dispute = await disputeRes.json();
    const disputeId = dispute.dispute.id;

    const resolveRes = await ctx.post(`/disputes/${disputeId}/resolve`, {
      data: {
        resolution: "REFUND",
        note: "หลักฐานชัดเจนว่าของไม่ตรง"
      },
      headers: { Authorization: `Bearer ${adminAuth.token}` }
    });
    expect(resolveRes.ok()).toBeTruthy();
    const resolveJson = await resolveRes.json();
    expect(resolveJson.status).toBe("REFUND");
  });
});
