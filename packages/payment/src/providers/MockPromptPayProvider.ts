import { ulid } from "ulid";
import type { IPaymentProvider } from "../PaymentProvider";
import type {
  CreateChargeRequest,
  CreateChargeResponse,
  RefundRequest,
  RefundResponse,
  WebhookPayload,
  WebhookVerificationResult,
} from "../types";

export class MockPromptPayProvider implements IPaymentProvider {
  readonly provider = "mock_promptpay";

  async createCharge(
    request: CreateChargeRequest
  ): Promise<CreateChargeResponse> {
    const providerRef = `MOCK_${ulid()}`;
    const amountBaht = request.amountSatang / 100;

    // Generate a mock QR code string (in real implementation, this would be a PromptPay QR)
    const qrString = `00020101021229370016A00000067701011101130066${request.deal.seller_id}5802TH5303764540${amountBaht.toFixed(2)}6304${this.generateChecksum(providerRef)}`;

    return {
      qrString,
      providerRef,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    };
  }

  async refund(request: RefundRequest): Promise<RefundResponse> {
    // Mock refund - just return success
    // In real implementation, this would call the PSP API
    return {
      success: true,
      refundId: `REFUND_${ulid()}`,
      providerRef: `MOCK_REFUND_${ulid()}`,
    };
  }

  async verifyWebhook(
    payload: WebhookPayload,
    secret: string
  ): Promise<WebhookVerificationResult> {
    // Mock webhook verification
    // In real implementation, verify signature using secret
    if (payload.provider !== this.provider) {
      return {
        valid: false,
        error: "Invalid provider",
      };
    }

    // Mock: accept if secret matches or if it's a test webhook
    if (secret === "mock_secret" || payload.data.test === true) {
      return {
        valid: true,
        payload: payload.data,
      };
    }

    return {
      valid: false,
      error: "Invalid webhook signature",
    };
  }

  private generateChecksum(data: string): string {
    // Simple mock checksum
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data.charCodeAt(i);
    }
    return (sum % 10000).toString(16).padStart(4, "0").toUpperCase();
  }
}
