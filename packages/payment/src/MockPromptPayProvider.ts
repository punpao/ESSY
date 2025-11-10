import { PaymentProvider } from "./PaymentProvider";
import type {
  ChargeRequest,
  ChargeResponse,
  RefundRequest,
  RefundResponse,
  WebhookPayload,
} from "./types";

/**
 * Mock PromptPay provider for development/testing.
 * Generates fake QR codes and simulates payment webhooks.
 */
export class MockPromptPayProvider implements PaymentProvider {
  private webhookSecret: string;

  constructor(webhookSecret: string = "mock_secret") {
    this.webhookSecret = webhookSecret;
  }

  getName(): string {
    return "mock_promptpay";
  }

  async createCharge(request: ChargeRequest): Promise<ChargeResponse> {
    // Generate a mock QR string (format: PROMPTPAY|{amount}|{ref})
    const providerRef = `MOCK_${Date.now()}_${request.dealId.slice(0, 8)}`;
    const amountBaht = (request.amountSatang / 100).toFixed(2);
    const qrString = `00020101021153037645802TH29370016A00000067701011201150066${providerRef}5802TH6304`;

    return {
      qrString,
      providerRef,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min
    };
  }

  async refund(request: RefundRequest): Promise<RefundResponse> {
    // Mock refund - just return success
    return {
      refundId: `REFUND_${Date.now()}_${request.paymentId.slice(0, 8)}`,
      status: "refunded",
    };
  }

  async verifyWebhook(payload: WebhookPayload): Promise<boolean> {
    // Mock verification - accept if signature matches or is missing (for dev)
    if (!payload.signature) {
      return true; // Allow unsigned in dev
    }
    // In production, verify HMAC signature
    return payload.signature === this.webhookSecret;
  }
}
