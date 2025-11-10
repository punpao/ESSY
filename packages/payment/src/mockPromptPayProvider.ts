import crypto from "node:crypto";
import {
  ChargeResponse,
  DealChargeInput,
  PaymentProvider,
  PaymentWebhookResult,
  RefundInput,
  RefundResponse,
  WebhookVerificationInput
} from "./types";

function buildPromptPayQr(input: DealChargeInput): string {
  const amount = (input.money.amountSatang / 100).toFixed(2);
  return `PROMPTPAY|ID:${input.sellerPromptPayId}|AMOUNT:${amount}|TOKEN:${input.paylinkToken}`;
}

export class MockPromptPayProvider implements PaymentProvider {
  readonly name = "mock_promptpay" as const;

  createCharge(input: DealChargeInput): Promise<ChargeResponse> {
    const providerRef = crypto.randomUUID();
    return Promise.resolve({
      providerRef,
      qrString: buildPromptPayQr(input),
      deepLink: `https://promptpay.io/pay/${providerRef}`
    });
  }

  refund(input: RefundInput): Promise<RefundResponse> {
    return Promise.resolve({
      status: "REFUNDED",
      message: `Mock refund completed for ${input.providerRef}`
    });
  }

  verifyWebhook(input: WebhookVerificationInput): PaymentWebhookResult {
    const payload =
      typeof input.payload === "object" && input.payload
        ? (input.payload as Record<string, unknown>)
        : {};
    const providedSecret = payload["secret"];
    if (providedSecret !== input.secret) {
      throw new Error("Invalid webhook signature");
    }

    const providerRef = String(payload["providerRef"]);
    const status = String(payload["status"]).toUpperCase();

    switch (status) {
      case "PAID":
        return {
          action: "payment.succeeded",
          providerRef,
          status: "PAID",
          raw: input.payload
        };
      case "FAILED":
        return {
          action: "payment.failed",
          providerRef,
          status: "FAILED",
          raw: input.payload
        };
      case "REFUNDED":
        return {
          action: "payment.refunded",
          providerRef,
          status: "REFUNDED",
          raw: input.payload
        };
      default:
        throw new Error(`Unsupported mock status: ${status}`);
    }
  }
}
