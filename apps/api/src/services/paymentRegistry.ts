import { MockPromptPayProvider, PaymentProvider, PaymentProviderName } from "@escrow/payment";

export type PaymentRegistry = {
  get(name: PaymentProviderName): PaymentProvider;
  getDefault(): PaymentProvider;
};

export function buildPaymentRegistry(): PaymentRegistry {
  const mock = new MockPromptPayProvider();
  const table: Record<PaymentProviderName, PaymentProvider> = {
    mock_promptpay: mock
  };

  return {
    get: (name) => table[name],
    getDefault: () => mock
  };
}
