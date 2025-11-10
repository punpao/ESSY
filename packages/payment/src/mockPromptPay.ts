import crypto from 'crypto';
import { PaymentProvider, PaymentTransaction, PaymentChargeResult } from './provider';

export interface MockPromptPayOptions {
  webhookSecret: string;
}

export class MockPromptPayProvider implements PaymentProvider {
  private webhookSecret: string;

  constructor(options: MockPromptPayOptions) {
    this.webhookSecret = options.webhookSecret;
  }

  async createCharge(tx: PaymentTransaction): Promise<PaymentChargeResult> {
    const providerRef = crypto.randomBytes(8).toString('hex');
    const qrString = `PROMPTPAY|REF=${providerRef}|AMOUNT=${(tx.amountSatang / 100).toFixed(2)}`;
    return { providerRef, qrString };
  }

  async refund(): Promise<void> {
    return;
  }

  verifyWebhook(payload: unknown, headers: Record<string, string | string[] | undefined>): boolean {
    const signature = typeof headers['x-mock-signature'] === 'string' ? headers['x-mock-signature'] : '';
    if (!signature) return false;
    const body = JSON.stringify(payload ?? {});
    const expected = crypto.createHmac('sha256', this.webhookSecret).update(body).digest('hex');
    return expected === signature;
  }
}
