import { z } from 'zod'

export const escrowStateSchema = z.enum([
  'PENDING',
  'HOLD',
  'SHIPPED',
  'RELEASED',
  'DISPUTE',
  'REFUND'
])

export type EscrowState = z.infer<typeof escrowStateSchema>

export const escrowEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('PAYMENT_HELD')
  }),
  z.object({
    type: z.literal('SELLER_SHIPPED'),
    trackingNumber: z.string().min(3),
    courier: z.string().min(2),
    deliveredAt: z.date().optional()
  }),
  z.object({
    type: z.literal('BUYER_CONFIRMED')
  }),
  z.object({
    type: z.literal('AUTO_RELEASE')
  }),
  z.object({
    type: z.literal('BUYER_OPENED_DISPUTE'),
    reason: z.enum(['not_received', 'not_as_described', 'other'])
  }),
  z.object({
    type: z.literal('ADMIN_RESOLVE_REFUND'),
    note: z.string().optional()
  }),
  z.object({
    type: z.literal('ADMIN_RESOLVE_RELEASE'),
    note: z.string().optional()
  }),
  z.object({
    type: z.literal('SELLER_CANCELLED')
  })
])

export type EscrowEvent = z.infer<typeof escrowEventSchema>

export type EscrowContext = {
  hasPayment: boolean
  hasDispute: boolean
  deliveredAt?: Date | null
  autoReleaseAt?: Date | null
  now?: Date
}

export class EscrowTransitionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EscrowTransitionError'
  }
}

const TERMINAL_STATES: EscrowState[] = ['RELEASED', 'REFUND']

export const isTerminalState = (state: EscrowState): boolean =>
  TERMINAL_STATES.includes(state)

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new EscrowTransitionError(message)
  }
}

const canAutoRelease = (context: EscrowContext): boolean => {
  if (context.hasDispute) {
    return false
  }
  const now = context.now ?? new Date()
  if (context.deliveredAt) {
    return true
  }
  if (context.autoReleaseAt) {
    return now >= context.autoReleaseAt
  }
  return false
}

export const transitionEscrowState = (
  from: EscrowState,
  rawEvent: EscrowEvent,
  context: EscrowContext
): EscrowState => {
  const event = escrowEventSchema.parse(rawEvent)

  switch (from) {
    case 'PENDING': {
      if (event.type === 'PAYMENT_HELD') {
        assert(context.hasPayment, 'Payment must be captured before HOLD')
        return 'HOLD'
      }
      if (event.type === 'SELLER_CANCELLED') {
        assert(!context.hasPayment, 'Cannot cancel after payment')
        return 'REFUND'
      }
      break
    }
    case 'HOLD': {
      if (event.type === 'SELLER_SHIPPED') {
        return 'SHIPPED'
      }
      if (event.type === 'BUYER_OPENED_DISPUTE') {
        return 'DISPUTE'
      }
      break
    }
    case 'SHIPPED': {
      if (event.type === 'BUYER_CONFIRMED') {
        return 'RELEASED'
      }
      if (event.type === 'AUTO_RELEASE') {
        assert(
          canAutoRelease(context),
          'Auto release requested but guard conditions failed'
        )
        return 'RELEASED'
      }
      if (event.type === 'BUYER_OPENED_DISPUTE') {
        return 'DISPUTE'
      }
      break
    }
    case 'DISPUTE': {
      if (event.type === 'ADMIN_RESOLVE_REFUND') {
        return 'REFUND'
      }
      if (event.type === 'ADMIN_RESOLVE_RELEASE') {
        return 'RELEASED'
      }
      break
    }
    case 'RELEASED':
    case 'REFUND': {
      throw new EscrowTransitionError('Terminal state cannot transition further')
    }
    default:
      break
  }

  throw new EscrowTransitionError(
    `Invalid escrow transition from ${from} with event ${event.type}`
  )
}

export const computeAutoReleaseAt = (
  deliveredAt: Date,
  hours: number
): Date => {
  const auto = new Date(deliveredAt.getTime())
  auto.setHours(auto.getHours() + hours)
  return auto
}
