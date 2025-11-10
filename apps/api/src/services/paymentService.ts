import { MockPromptPayProvider } from '@escrow/payment'
import { env } from '../env'

const mockPromptPayProvider = new MockPromptPayProvider(
  env.PAYMENT_WEBHOOK_SECRET
)

export const paymentProviders = {
  mock_promptpay: mockPromptPayProvider
}

export type PaymentProviderKey = keyof typeof paymentProviders

export const getPaymentProvider = (key: PaymentProviderKey) => {
  const provider = paymentProviders[key]
  if (!provider) {
    throw new Error(`Unsupported payment provider: ${key}`)
  }
  return provider
}
