import { DealStatus } from '@escrow/core'

export type PaymentProviderId = 'mock_promptpay'

export type PaymentChargeRequest = {
  dealId: string
  paylinkToken: string
  title: string
  amountSatang: number
  currency: 'THB'
  sellerPromptPayId: string
  sellerPromptPayName?: string | null
}

export type PaymentChargeResponse = {
  qrString: string
  providerRef: string
  expiresAt?: Date
}

export type PaymentStatusUpdate =
  | {
      status: 'PAID'
      providerRef: string
      paidAt: Date
      buyerId?: string
    }
  | {
      status: 'FAILED'
      providerRef: string
      failureReason?: string
    }

export type PaymentRefundResponse = {
  providerRef: string
  refundedAt: Date
}

export type PaymentWebhookPayload = Record<string, unknown>

export type PaymentProviderContext = {
  dealStatus: DealStatus
  secret: string
}

export interface PaymentProvider {
  id: PaymentProviderId
  createCharge(
    input: PaymentChargeRequest
  ): Promise<PaymentChargeResponse>
  handleWebhook(
    payload: PaymentWebhookPayload
  ): Promise<PaymentStatusUpdate>
  refund(
    providerRef: string
  ): Promise<PaymentRefundResponse>
}
