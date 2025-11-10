import crypto from 'crypto';
import { customAlphabet } from 'nanoid';
import type { PaymentProvider } from '../types';

const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 16);

export class MockPromptPayProvider implements PaymentProvider {
  public readonly name = 'mock_promptpay';

  async createCharge(input: {
    dealId: string;
    amountSatang: number;
    currency: 'THB';
    description: string;
  }) {
    const providerRef = nanoid();
    const qrString = `PROMPTPAY|REF=${providerRef}|AMOUNT=${(
      input.amountSatang / 100
    ).toFixed(2)}|CUR=${input.currency}|DEAL=${input.dealId}`;
    return { qrString, providerRef };
  }

  async refund(_input: { paymentId: string; reason?: string }) {
    return Promise.resolve();
  }

  async verifyWebhook(payload: unknown, secret = 'mock_secret') {
    if (!payload || typeof payload !== 'object') {
      return { valid: false };
    }
    const { providerRef, status, dealId, amountSatang, signature } =
      payload as Record<string, unknown>;

    if (!providerRef || !status || !dealId || typeof amountSatang !== 'number') {
      return { valid: false };
    }

    if (typeof signature === 'string') {
      const hmac = crypto
        .createHmac('sha256', secret)
        .update(`${dealId}:${providerRef}:${amountSatang}`)
        .digest('hex');
      if (hmac !== signature) {
        return { valid: false };
      }
    }

    return {
      valid: true,
      dealId: String(dealId),
      providerRef: String(providerRef),
      status: status === 'PAID' ? 'PAID' : 'FAILED',
      amountSatang,
    };
  }
}

export const mockPromptPayProvider = new MockPromptPayProvider();
