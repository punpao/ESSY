import crypto from "crypto";
import { ulid } from "ulid";
import {
  CreateChargeInput,
  CreateChargeResult,
  PaymentProvider,
  PaymentWebhookVerification,
  RefundInput,
  RefundResult
} from "./types";

export interface MockPromptPayWebhookPayload {
  provider_ref: string;
  deal_id: string;
  amount_satang: number;
  status: "PAID" | "REFUNDED" | "FAILED";
  paid_at?: string;
}

export class MockPromptPayProvider
  implements PaymentProvider<MockPromptPayWebhookPayload>
{
  public readonly type = "mock_promptpay" as const;
  private readonly webhookSecret: string;

  constructor(options: { webhookSecret: string }) {
    this.webhookSecret = options.webhookSecret;
  }

  async createCharge(input: CreateChargeInput): Promise<CreateChargeResult> {
    const providerRef = ulid();
    const amountBaht = (input.amountSatang / 100).toFixed(2);
    const qrString = [
      "000201010212",
      `29370016A00000067701011101130066${providerRef}`,
      `5303764`,
      `540${amountBaht}`,
      `5802TH`,
      `6304`
    ].join("");

    return {
      qrString,
      providerRef,
      expiresAt: input.expiresAt
    };
  }

  async refund(_input: RefundInput): Promise<RefundResult> {
    return { success: true, message: "Mock PromptPay refund initiated" };
  }

  verifyWebhook(
    rawBody: string,
    signature: string
  ): PaymentWebhookVerification<MockPromptPayWebhookPayload> {
    const computed = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (computed !== signature) {
      return {
        valid: false,
        event: "payment.failed",
        payload: {
          provider_ref: "",
          deal_id: "",
          amount_satang: 0,
          status: "FAILED"
        },
        providerRef: ""
      };
    }

    const payload = JSON.parse(rawBody) as MockPromptPayWebhookPayload;

    let event: PaymentWebhookVerification["event"] = "payment.failed";
    if (payload.status === "PAID") {
      event = "payment.paid";
    } else if (payload.status === "REFUNDED") {
      event = "payment.refunded";
    }

    return {
      valid: true,
      event,
      payload,
      providerRef: payload.provider_ref
    };
  }
}

export function createMockPromptPayProvider(opts: {
  webhookSecret: string;
}): MockPromptPayProvider {
  return new MockPromptPayProvider(opts);
}
