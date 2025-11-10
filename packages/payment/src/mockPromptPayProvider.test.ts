import { describe, expect, it } from "vitest";
import { MockPromptPayProvider } from "./mockPromptPayProvider";

describe("MockPromptPayProvider", () => {
  const provider = new MockPromptPayProvider();

  it("creates qr string with promptpay format", async () => {
    const charge = await provider.createCharge({
      dealId: "deal_1",
      title: "รองเท้า Nike มือสอง",
      sellerPromptPayId: "0899999999",
      paylinkToken: "abc123",
      money: {
        amountSatang: 150000,
        currency: "THB"
      }
    });

    expect(charge.qrString).toContain("PROMPTPAY");
    expect(charge.providerRef).toBeDefined();
  });

  it("validates webhook secret", () => {
    const result = provider.verifyWebhook({
      payload: {
        secret: "mock_secret",
        providerRef: "ref123",
        status: "PAID"
      },
      secret: "mock_secret"
    });

    expect(result.status).toBe("PAID");
  });

  it("throws when secret mismatch", () => {
    expect(() =>
      provider.verifyWebhook({
        payload: { secret: "wrong", providerRef: "ref123", status: "PAID" },
        secret: "mock_secret"
      })
    ).toThrow();
  });
});
