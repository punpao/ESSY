import { z } from 'zod';

export const idSchema = z.string().uuid();
export const ulidSchema = z
  .string()
  .regex(/^[0-9A-HJKMNP-TV-Z]{26}$/i, 'Invalid ULID');

export const createDealSchema = z.object({
  title: z.string().min(3).max(120),
  amountThb: z.number().positive().max(1_000_000),
  buyerNote: z.string().max(500).optional(),
  currency: z.literal('THB').default('THB'),
});

export const setTrackingSchema = z.object({
  trackingNumber: z.string().min(5).max(100),
  courier: z.string().min(2).max(50),
});

export const markDeliveredSchema = z.object({
  deliveredAt: z.coerce.date(),
});

export const confirmReceiptSchema = z.object({
  dealId: ulidSchema,
});

export const disputeOpenSchema = z.object({
  dealId: ulidSchema,
  reason: z.enum(['not_arrived', 'not_as_described', 'other']),
  note: z.string().max(500).optional(),
});

export const disputeEvidenceSchema = z.object({
  evidence: z
    .array(
      z.object({
        kind: z.enum(['image', 'chatlog', 'other']).default('other'),
        url: z.string().url(),
        note: z.string().max(200).optional(),
      })
    )
    .min(1),
});

export const disputeResolveSchema = z.object({
  resolution: z.enum(['refund', 'release']),
  note: z.string().max(300).optional(),
});

export const paymentCreateSchema = z.object({
  dealId: ulidSchema,
});

export const promptpayWebhookSchema = z.object({
  providerRef: z.string(),
  status: z.enum(['PAID', 'FAILED']),
  dealId: ulidSchema,
  amountSatang: z.number().int().nonnegative(),
  signature: z.string().optional(),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;
export type SetTrackingInput = z.infer<typeof setTrackingSchema>;
export type DisputeOpenInput = z.infer<typeof disputeOpenSchema>;
export type DisputeEvidenceInput = z.infer<typeof disputeEvidenceSchema>;
export type DisputeResolveInput = z.infer<typeof disputeResolveSchema>;
export type PromptpayWebhookPayload = z.infer<typeof promptpayWebhookSchema>;
