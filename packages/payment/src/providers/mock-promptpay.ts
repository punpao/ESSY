import { ulid } from 'ulid';
import { PaymentProvider } from '../provider';
import {
  ChargeRequest,
  ChargeResponse,
  RefundRequest,
  RefundResponse,
  WebhookPayload,
} from '../types';

/**
 * Mock PromptPay Provider
 * 
 * Simulates Thai PromptPay QR payment flow without actual money movement.
 * In production, replace with real PSP integration (e.g., Omise, GB PrimePay).
 */
export class MockPromptPayProvider implements PaymentProvider {
  readonly name = 'mock_promptpay';
  private webhookSecret: string;

  constructor(config: { webhookSecret: string }) {
    this.webhookSecret = config.webhookSecret;
  }

  async createCharge(request: ChargeRequest): Promise<ChargeResponse> {
    const provider_ref = `MOCK_${ulid()}`;
    
    // Generate a mock PromptPay QR string
    // Format: |00|01|{amount}|{ref}
    const qr_string = `00020101021129370016A000000677010111${request.deal_id}5303764${String(
      request.amount_satang
    ).padStart(10, '0')}5802TH${provider_ref}6304`;

    // Mock charge expires in 15 minutes
    const expires_at = new Date(Date.now() + 15 * 60 * 1000);

    return {
      provider_ref,
      qr_string,
      expires_at,
    };
  }

  async refund(request: RefundRequest): Promise<RefundResponse> {
    const refund_ref = `REFUND_${ulid()}`;

    // Mock refund always succeeds immediately
    return {
      refund_ref,
      status: 'success',
    };
  }

  async verifyWebhook(signature: string, payload: string): Promise<WebhookPayload> {
    // In a real implementation, verify HMAC signature
    // For mock, we'll do basic validation

    if (signature !== this.webhookSecret) {
      throw new Error('Invalid webhook signature');
    }

    try {
      const data = JSON.parse(payload);
      return data as WebhookPayload;
    } catch (error) {
      throw new Error('Invalid webhook payload');
    }
  }

  /**
   * Helper method to simulate a webhook callback (for testing)
   */
  simulateWebhook(provider_ref: string, success: boolean): WebhookPayload {
    return {
      provider: this.name,
      provider_ref,
      event_type: success ? 'payment.success' : 'payment.failed',
      amount_satang: 0, // Will be filled by deal context
      paid_at: success ? new Date().toISOString() : undefined,
    };
  }
}
