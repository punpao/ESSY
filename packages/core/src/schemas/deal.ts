import { z } from 'zod'
import {
  disputeStatusSchema,
  evidenceKindSchema,
  reputationEventTypeSchema
} from '../types'

export const createDealSchema = z.object({
  title: z.string().min(3).max(120),
  amountTHB: z
    .number()
    .positive()
    .max(100000)
    .describe('Amount in THB, will be converted to satang'),
  buyerEmail: z.string().email().optional(),
  buyerNote: z.string().max(300).optional(),
  expiresInMinutes: z.number().int().positive().max(1440).optional()
})

export const shipDealSchema = z.object({
  trackingNumber: z.string().min(5).max(40),
  courier: z.string().min(2).max(60),
  deliveredAt: z
    .string()
    .datetime()
    .optional()
    .describe('ISO timestamp when courier marked delivered')
})

export const openDisputeSchema = z.object({
  reason: z.enum(['not_received', 'not_as_described', 'other']),
  message: z.string().min(10).max(500)
})

export const disputeEvidenceSchema = z.object({
  items: z
    .array(
      z.object({
        url: z.string().url(),
        kind: evidenceKindSchema.default('image'),
        note: z.string().max(200).optional()
      })
    )
    .min(1)
})

export const resolveDisputeSchema = z.object({
  resolution: z.enum(['RESOLVED_REFUND', 'RESOLVED_RELEASE']),
  note: z.string().min(5).max(500).optional()
})

export const reputationSnapshotSchema = z.object({
  releasedCount: z.number().int().nonnegative(),
  disputeCount: z.number().int().nonnegative(),
  weight: z.number().default(1),
  latestEvent: reputationEventTypeSchema.optional()
})

export const adminDealFilterSchema = z.object({
  status: z
    .enum(['PENDING', 'HOLD', 'SHIPPED', 'RELEASED', 'DISPUTE', 'REFUND'])
    .optional(),
  sellerId: z.string().uuid().optional(),
  buyerId: z.string().uuid().optional()
})

export const adminDisputeFilterSchema = z.object({
  status: disputeStatusSchema.optional()
})
