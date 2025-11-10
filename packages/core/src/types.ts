import { z } from 'zod'

export const userRoleSchema = z.enum(['buyer', 'seller', 'admin'])
export type UserRole = z.infer<typeof userRoleSchema>

export const kycLevelSchema = z.enum(['none', 'basic', 'full'])
export type KycLevel = z.infer<typeof kycLevelSchema>

export const kycStatusSchema = z.enum(['unverified', 'pending', 'verified'])
export type KycStatus = z.infer<typeof kycStatusSchema>

export const dealStatusSchema = z.enum([
  'PENDING',
  'HOLD',
  'SHIPPED',
  'RELEASED',
  'DISPUTE',
  'REFUND'
])
export type DealStatus = z.infer<typeof dealStatusSchema>

export const paymentStatusSchema = z.enum([
  'INIT',
  'PAID',
  'REFUNDED',
  'FAILED'
])
export type PaymentStatus = z.infer<typeof paymentStatusSchema>

export const disputeStatusSchema = z.enum([
  'OPEN',
  'NEED_MORE_INFO',
  'RESOLVED_REFUND',
  'RESOLVED_RELEASE'
])
export type DisputeStatus = z.infer<typeof disputeStatusSchema>

export const evidenceKindSchema = z.enum(['image', 'chatlog', 'other'])
export type EvidenceKind = z.infer<typeof evidenceKindSchema>

export const reputationEventTypeSchema = z.enum([
  'positive',
  'neutral',
  'negative'
])
export type ReputationEventType = z.infer<typeof reputationEventTypeSchema>
