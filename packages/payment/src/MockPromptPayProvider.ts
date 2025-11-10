import { PaymentProvider } from './PaymentProvider';
import type {
  ChargeRequest,
  ChargeResponse,
  RefundRequest,
  RefundResponse,
  WebhookPayload,
} from './types';

/**
 * Mock PromptPay Provider
 * Simulates PromptPay QR code generation and payment webhooks
 * For MVP only - does not handle real money
 */
export class MockPromptPayProvider implements PaymentProvider {
  readonly name = 'mock_promptpay';

  async createCharge(request: ChargeRequest): Promise<ChargeResponse> {
    // Generate a mock QR string (format: PROMPTPAY|{phone}|{amount})
    const mockPhone = '0812345678';
    const amountBaht = (request.amountSatang / 100).toFixed(2);
    const qrString = `00020101021253037645406${amountBaht}5802TH29370016A000000677010111${mockPhone}6304MOCK`;

    // Generate a unique provider reference
    const providerRef = `MOCK_${Date.now()}_${Math.random().toString(36).substring(7)}`;

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
      status: 'SUCCESS',
      amountSatang: request.amountSatang || 0,
    };
  }

  verifyWebhook(payload: unknown, signature: string): boolean {
    // Mock verification - in production, verify against provider's secret
    // For MVP, accept if signature matches expected format
    return typeof signature === 'string' && signature.length > 0;
  }

  parseWebhook(payload: unknown): WebhookPayload | null {
    if (!payload || typeof payload !== 'object') {
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
        status: p.status as 'PAID' | 'FAILED' | 'REFUNDED',
        amountSatang: p.amountSatang,
        timestamp: typeof p.timestamp === 'string' ? p.timestamp : new Date().toISOString(),
        signature: typeof p.signature === 'string' ? p.signature : undefined,
      };
    }

    return null;
  }
}
