import { randomBytes } from 'crypto';
import type { PaymentProvider } from './PaymentProvider';
import type {
  ChargeRequest,
  ChargeResponse,
  RefundRequest,
  RefundResponse,
  WebhookPayload,
} from './types';

/**
 * Mock PromptPay QR provider for MVP
 * Generates QR codes and simulates payment callbacks
 */
export class MockPromptPayProvider implements PaymentProvider {
  private webhookSecret: string;

  constructor(webhookSecret: string) {
    this.webhookSecret = webhookSecret;
  }

  async createCharge(request: ChargeRequest): Promise<ChargeResponse> {
    // Generate mock QR string (format: PROMPTPAY|phone|amount)
    // In real implementation, this would call Opn/Omise/Xendit API
    const providerRef = `mock_${randomBytes(16).toString('hex')}`;
    const amountBaht = (request.amountSatang / 100).toFixed(2);

    // Mock QR format: PROMPTPAY|phone|amount
    // Using a mock phone number for demo
    const qrString = `00020101021229370016A000000677010111011300668888888885802TH5303764540${amountBaht}6304`;

    return {
      qrString,
      providerRef,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min expiry
    };
  }

  async refund(request: RefundRequest): Promise<RefundResponse> {
    // Mock refund - just return success
    // In real implementation, this would call PSP API
    const refundId = `refund_${randomBytes(16).toString('hex')}`;

    return {
      refundId,
      status: 'success',
      amountSatang: request.amountSatang || 0, // Full refund if not specified
    };
  }

  verifyWebhook(payload: unknown, signature: string): boolean {
    // Mock verification - in production, verify HMAC signature
    // For MVP, just check that signature matches secret
    return signature === this.webhookSecret;
  }

  parseWebhook(payload: unknown): WebhookPayload | null {
    // Parse mock webhook format
    if (typeof payload !== 'object' || payload === null) {
      return null;
    }

    const p = payload as Record<string, unknown>;

    if (
      typeof p.providerRef === 'string' &&
      typeof p.status === 'string' &&
      typeof p.amountSatang === 'number'
    ) {
      return {
        providerRef: p.providerRef,
        status: p.status as 'paid' | 'failed' | 'refunded',
        amountSatang: p.amountSatang,
        timestamp: typeof p.timestamp === 'string' ? p.timestamp : new Date().toISOString(),
        signature: typeof p.signature === 'string' ? p.signature : undefined,
      };
    }

    return null;
  }
}
