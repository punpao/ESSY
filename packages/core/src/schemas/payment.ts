import { z } from 'zod'

export const createPaymentSchema = z.object({
  dealId: z.string().min(10),
  amountSatang: z.number().int().positive(),
  currency: z.literal('THB')
})

export const promptPayChargeSchema = z.object({
  qrString: z.string(),
  providerRef: z.string()
})

export const mockPromptPayWebhookSchema = z.object({
  provider_ref: z.string(),
  deal_id: z.string(),
  status: z.enum(['PAID', 'FAILED']),
  paid_amount: z.number().int().nonnegative(),
  signature: z.string().optional(),
  buyer_id: z.string().optional()
})

export const refundPaymentSchema = z.object({
  note: z.string().max(300).optional()
})
