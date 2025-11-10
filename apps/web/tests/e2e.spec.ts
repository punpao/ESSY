import { test, expect, request as playwrightRequest } from "@playwright/test";
import crypto from "crypto";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:4000/api/v1";
const WEBHOOK_SECRET = process.env.NEXT_PUBLIC_MOCK_WEBHOOK_SECRET ?? "mock_secret";

async function createUser(role: "buyer" | "seller" | "admin", email: string) {
  const ctx = await playwrightRequest.newContext({ baseURL: BASE_URL });
  const res = await ctx.post("/auth/line/callback", {
    data: {
      line_sub: `e2e-${role}-${Date.now()}-${Math.random()}`,
      display_name: `E2E ${role}`,
      email,
      role
    }
  });
  const json = await res.json();
  return json as { token: string; user: { id: string } };
}

async function authContext(token: string) {
  return playwrightRequest.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
}

function signPayload(payload: object) {
  const serialized = JSON.stringify(payload);
  return crypto.createHmac("sha256", WEBHOOK_SECRET).update(serialized).digest("hex");
}

test("buyer payment flow reaches HOLD", async () => {
  const seller = await createUser("seller", `seller+${Date.now()}@test.com`);
  const buyer = await createUser("buyer", `buyer+${Date.now()}@test.com`);

  const sellerCtx = await authContext(seller.token);
  const createDealRes = await sellerCtx.post("/deals", {
    data: {
      title: "E2E กระเป๋า",
      amount_thb: 1500,
      buyer_note: "ทดสอบระบบ"
    }
  });
  const dealData = await createDealRes.json();
  expect(createDealRes.ok()).toBeTruthy();

  const payRes = await playwrightRequest.newContext({ baseURL: BASE_URL }).post("/payments/create", {
    data: {
      paylink_token: dealData.deal.paylinkToken,
      buyer_id: buyer.user.id
    }
  });
  const payment = await payRes.json();

  const webhookPayload = {
    provider_ref: payment.provider_ref,
    deal_id: dealData.deal.id,
    amount_satang: payment.amount_satang,
    buyer_id: buyer.user.id,
    status: "PAID"
  };

  const signature = signPayload(webhookPayload);
  const webhookRes = await playwrightRequest
    .newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: {
        "Content-Type": "application/json",
        "x-mock-signature": signature
      }
    })
    .post("/payments/webhook/mock", {
      data: webhookPayload
    });
  expect(webhookRes.ok()).toBeTruthy();

  const buyerCtx = await authContext(buyer.token);
  const dealStatusRes = await buyerCtx.get(`/deals/${dealData.deal.id}`);
  const dealStatus = await dealStatusRes.json();
  expect(dealStatus.deal.status).toBe("HOLD");
});

test("shipping and buyer confirmation releases funds", async () => {
  const seller = await createUser("seller", `seller+ship${Date.now()}@test.com`);
  const buyer = await createUser("buyer", `buyer+ship${Date.now()}@test.com`);

  const sellerCtx = await authContext(seller.token);
  const dealRes = await sellerCtx.post("/deals", {
    data: {
      title: "E2E iPhone",
      amount_thb: 34000
    }
  });
  const deal = await dealRes.json();

  const payRes = await playwrightRequest
    .newContext({ baseURL: BASE_URL })
    .post("/payments/create", {
      data: {
        paylink_token: deal.deal.paylinkToken,
        buyer_id: buyer.user.id
      }
    });
  const payment = await payRes.json();

  const payload = {
    provider_ref: payment.provider_ref,
    deal_id: deal.deal.id,
    amount_satang: payment.amount_satang,
    buyer_id: buyer.user.id,
    status: "PAID"
  };
  const signature = signPayload(payload);
  await playwrightRequest
    .newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: {
        "Content-Type": "application/json",
        "x-mock-signature": signature
      }
    })
    .post("/payments/webhook/mock", { data: payload });

  await sellerCtx.post(`/deals/${deal.deal.id}/ship`, {
    data: {
      tracking_number: "E2E123456TH",
      courier: "ThaiPost",
      delivered_at: new Date().toISOString()
    }
  });

  const buyerCtx = await authContext(buyer.token);
  await buyerCtx.post(`/deals/${deal.deal.id}/confirm`, {
    data: { note: "E2E received" }
  });

  const statusRes = await sellerCtx.get(`/deals/${deal.deal.id}`);
  const status = await statusRes.json();
  expect(status.deal.status).toBe("RELEASED");
});

test("dispute resolved as refund", async () => {
  const seller = await createUser("seller", `seller+dispute${Date.now()}@test.com`);
  const buyer = await createUser("buyer", `buyer+dispute${Date.now()}@test.com`);
  const admin = await createUser("admin", `admin+dispute${Date.now()}@test.com`);

  const sellerCtx = await authContext(seller.token);
  const dealRes = await sellerCtx.post("/deals", {
    data: {
      title: "E2E Sneaker",
      amount_thb: 4000
    }
  });
  const deal = await dealRes.json();

  const paymentRes = await playwrightRequest
    .newContext({ baseURL: BASE_URL })
    .post("/payments/create", {
      data: {
        paylink_token: deal.deal.paylinkToken,
        buyer_id: buyer.user.id
      }
    });
  const payment = await paymentRes.json();
  const payPayload = {
    provider_ref: payment.provider_ref,
    deal_id: deal.deal.id,
    amount_satang: payment.amount_satang,
    buyer_id: buyer.user.id,
    status: "PAID"
  };
  const signature = signPayload(payPayload);
  await playwrightRequest
    .newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: {
        "Content-Type": "application/json",
        "x-mock-signature": signature
      }
    })
    .post("/payments/webhook/mock", { data: payPayload });

  const buyerCtx = await authContext(buyer.token);
  const disputeRes = await buyerCtx.post(`/disputes/${deal.deal.id}/open`, {
    data: {
      reason_text: "ของไม่ตรงปก",
      reason_code: "ไม่ตรงปก"
    }
  });
  expect(disputeRes.ok()).toBeTruthy();

  const adminCtx = await authContext(admin.token);
  await adminCtx.post(`/disputes/${(await disputeRes.json()).dispute.id}/resolve`, {
    data: {
      action: "REFUND",
      note: "สีไม่ตรงตามรูป"
    }
  });

  const statusRes = await adminCtx.get(`/deals/${deal.deal.id}`);
  const status = await statusRes.json();
  expect(status.deal.status).toBe("REFUND");
});
