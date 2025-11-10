import { z } from 'zod';

export const paymentProviderConfigSchema = z.object({
  webhookSecret: z.string()
});

export type PaymentProviderConfig = z.infer<typeof paymentProviderConfigSchema>;

export interface PaymentChargeResult {
  qrString: string;
  providerRef: string;
}

export interface PaymentTransaction {
  id: string;
  amountSatang: number;
  currency: string;
}

export interface PaymentProvider {
  createCharge(tx: PaymentTransaction): Promise<PaymentChargeResult>;
  refund(tx: PaymentTransaction & { providerRef: string }): Promise<void>;
  verifyWebhook(payload: unknown, headers: Record<string, string | string[] | undefined>): boolean;
}
