import { PaymentProvider } from "./PaymentProvider";
import {
  ChargeRequest,
  ChargeResponse,
  RefundRequest,
  RefundResponse,
  WebhookPayload,
} from "./types";

export class MockPromptPayProvider implements PaymentProvider {
  private readonly webhookSecret: string;

  constructor(webhookSecret: string = "mock_secret") {
    this.webhookSecret = webhookSecret;
  }

  async createCharge(request: ChargeRequest): Promise<ChargeResponse> {
    // Generate a mock QR string (in real implementation, this would be a PromptPay QR code)
    const providerRef = `MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const qrString = `0002010102125303764540610${request.amountSatang}5802TH6304${this.generateChecksum(providerRef)}`;

    return {
      qrString,
      providerRef,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
  }

  async refund(request: RefundRequest): Promise<RefundResponse> {
    // Mock refund - just return success
    const refundId = `REFUND_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      refundId,
      status: "SUCCESS",
      providerRef: refundId,
    };
  }

  verifyWebhook(payload: unknown, signature?: string): boolean {
    // Mock verification - in production, verify HMAC signature
    if (!signature) return true; // Allow unsigned for mock
    return signature === this.webhookSecret;
  }

  parseWebhook(payload: unknown): WebhookPayload {
    const p = payload as Record<string, unknown>;
    return {
      providerRef: p.providerRef as string,
      status: p.status as "PAID" | "FAILED" | "REFUNDED",
      amountSatang: Number(p.amountSatang),
      metadata: p.metadata as Record<string, unknown> | undefined,
      signature: p.signature as string | undefined,
    };
  }

  private generateChecksum(data: string): string {
    // Simple mock checksum
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(4, "0").toUpperCase();
  }
}
