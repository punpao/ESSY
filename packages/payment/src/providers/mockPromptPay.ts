import crypto from 'node:crypto'

import {
  mockPromptPayWebhookSchema,
  promptPayChargeSchema
} from '@escrow/core'

import {
  PaymentChargeRequest,
  PaymentChargeResponse,
  PaymentProvider,
  PaymentRefundResponse,
  PaymentStatusUpdate,
  PaymentWebhookPayload
} from '../types'

const QR_PREFIX = 'PROMPTPAY'

const buildQrString = (payload: PaymentChargeRequest): string => {
  const { dealId, amountSatang, sellerPromptPayId, sellerPromptPayName } = payload
  const meta = [
    QR_PREFIX,
    dealId,
    amountSatang,
    sellerPromptPayId,
    sellerPromptPayName ?? 'UNKNOWN'
  ].join('|')
  return Buffer.from(meta).toString('base64url')
}

const generateProviderRef = (dealId: string): string =>
  `mockpp_${dealId}_${Date.now()}`

const verifySignature = (body: string, secret: string, signature?: string) => {
  if (!signature) {
    return false
  }
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (signatureBuffer.length !== expectedBuffer.length) {
    return false
  }
  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
}

export class MockPromptPayProvider implements PaymentProvider {
  readonly id = 'mock_promptpay'

  constructor(private readonly webhookSecret: string) {}

  async createCharge(
    payload: PaymentChargeRequest
  ): Promise<PaymentChargeResponse> {
    const qrString = buildQrString(payload)
    const providerRef = generateProviderRef(payload.dealId)
    return promptPayChargeSchema.parse({
      qrString,
      providerRef
    })
  }

  async handleWebhook(
    payload: PaymentWebhookPayload
  ): Promise<PaymentStatusUpdate> {
    const parsed = mockPromptPayWebhookSchema.parse(payload)

    if (parsed.signature) {
      const body = JSON.stringify({
        provider_ref: parsed.provider_ref,
        deal_id: parsed.deal_id,
        status: parsed.status,
        paid_amount: parsed.paid_amount
      })
      const isValid = verifySignature(body, this.webhookSecret, parsed.signature)
      if (!isValid) {
        throw new Error('Invalid PromptPay webhook signature')
      }
    }

    if (parsed.status === 'PAID') {
      return {
        status: 'PAID',
        providerRef: parsed.provider_ref,
        paidAt: new Date(),
        buyerId: parsed.buyer_id
      }
    }

    return {
      status: 'FAILED',
      providerRef: parsed.provider_ref
    }
  }

  async refund(providerRef: string): Promise<PaymentRefundResponse> {
    return {
      providerRef,
      refundedAt: new Date()
    }
  }
}

export const signMockPromptPayPayload = ({
  providerRef,
  dealId,
  status,
  amount,
  secret
}: {
  providerRef: string
  dealId: string
  status: 'PAID' | 'FAILED'
  amount: number
  secret: string
}) => {
  const body = JSON.stringify({
    provider_ref: providerRef,
    deal_id: dealId,
    status,
    paid_amount: amount
  })

  return crypto.createHmac('sha256', secret).update(body).digest('hex')
}
