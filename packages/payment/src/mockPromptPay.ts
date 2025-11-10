import crypto from 'node:crypto';
import { PaymentDealInput, PaymentProvider, ChargeResult, RefundResult, WebhookVerificationInput, WebhookVerificationResult } from './provider';

export class MockPromptPayProvider implements PaymentProvider {
  public readonly name = 'mock_promptpay';

  async createCharge(deal: PaymentDealInput): Promise<ChargeResult> {
    const providerRef = `MOCK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const amountBaht = (deal.amountSatang / 100).toFixed(2);
    const qrString = `PROMPTPAY|AMOUNT=${amountBaht}|REF=${providerRef}|DEAL=${deal.id}|PPID=${deal.sellerPromptpayId}`;
    return {
      providerRef,
      qrString,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    };
  }

  async refund(providerRef: string): Promise<RefundResult> {
    return {
      providerRef,
      refunded: true
    };
  }

  async verifyWebhook(input: WebhookVerificationInput): Promise<WebhookVerificationResult> {
    if (!input.payload || typeof input.payload !== 'object') {
      return { valid: false };
    }
    const payload = input.payload as Record<string, unknown>;
    const providerRef = String(payload.providerRef ?? '');
    const status = String(payload.status ?? 'FAILED').toUpperCase();

    if (!providerRef) {
      return { valid: false };
    }

    if (input.signature) {
      const expected = crypto.createHmac('sha256', input.secret).update(JSON.stringify(payload)).digest('hex');
      if (expected !== input.signature) {
        return { valid: false };
      }
    }

    return {
      valid: true,
      providerRef,
      status: status === 'PAID' ? 'PAID' : 'FAILED'
    };
  }
}
