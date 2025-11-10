import { IPaymentProvider } from "./PaymentProvider";
import type {
  ChargeRequest,
  ChargeResponse,
  RefundRequest,
  RefundResponse,
  WebhookPayload,
} from "./types";

/**
 * Mock PromptPay Provider
 * Simulates PromptPay QR code generation and payment webhooks
 * In production, replace with real provider (Opn, Omise, Xendit, GB PrimePay)
 */
export class MockPromptPayProvider implements IPaymentProvider {
  private webhookSecret: string;

  constructor(webhookSecret: string) {
    this.webhookSecret = webhookSecret;
  }

  async createCharge(request: ChargeRequest): Promise<ChargeResponse> {
    // Generate mock QR string (in real implementation, call PSP API)
    const providerRef = `MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const qrString = `00020101021229370016A00000067701011101130066${request.amountSatang}5303764540${request.amountSatang}5802TH6304${providerRef.substring(0, 4)}`;

    return {
      qrString,
      providerRef,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    };
  }

  async refund(request: RefundRequest): Promise<RefundResponse> {
    // Mock refund - just return success
    return {
      refundId: `REFUND_${Date.now()}`,
      status: "refunded",
      amountSatang: request.amountSatang || 0,
    };
  }

  async verifyWebhook(payload: WebhookPayload): Promise<boolean> {
    // In production, verify HMAC signature
    // For mock, just check if secret matches
    return payload.signature === this.webhookSecret || true; // Always true for mock
  }

  async parseWebhook(payload: WebhookPayload): Promise<{
    event: string;
    paymentRef: string;
    status: "paid" | "failed" | "refunded";
    metadata?: Record<string, unknown>;
  }> {
    // Parse mock webhook format
    const data = payload.data as {
      providerRef: string;
      status: "paid" | "failed" | "refunded";
      amountSatang?: number;
      paidAt?: string;
    };

    return {
      event: payload.event,
      paymentRef: data.providerRef,
      status: data.status || "paid",
      metadata: {
        amountSatang: data.amountSatang,
        paidAt: data.paidAt,
      },
    };
  }
}
