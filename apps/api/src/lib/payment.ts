import { MockPromptPayProvider, type PaymentProvider } from '@thai-social-escrow/payment';

const providers: Record<string, PaymentProvider> = {
  mock_promptpay: new MockPromptPayProvider()
};

export function getPaymentProvider(name: string): PaymentProvider {
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Payment provider ${name} not configured`);
  }
  return provider;
}

export function getDefaultPaymentProvider(): PaymentProvider {
  return providers.mock_promptpay;
}
