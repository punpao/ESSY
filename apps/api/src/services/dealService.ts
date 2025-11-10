import type {
  Deal,
  Dispute,
  Payment,
  Prisma,
  PrismaClient
} from '@prisma/client'
import {
  EscrowEvent,
  EscrowState,
  EscrowTransitionError,
  computeAutoReleaseAt,
  transitionEscrowState
} from '@escrow/core'
import { env } from '../env'

type DealWithRelations = Deal & {
  payments: Payment[]
  dispute: Dispute | null
}

const buildContext = (deal: DealWithRelations) => ({
  hasPayment: deal.payments.some((payment) => payment.status === 'PAID'),
  hasDispute:
    !!deal.dispute &&
    ['OPEN', 'NEED_MORE_INFO'].includes(deal.dispute.status),
  deliveredAt: deal.deliveredAt ?? undefined,
  autoReleaseAt: deal.autoReleaseAt ?? undefined
})

export const includeDealRelations = {
  payments: true,
  dispute: true
} satisfies Prisma.DealInclude

export const loadDeal = async (
  prisma: PrismaClient,
  dealId: string
): Promise<DealWithRelations> => {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: includeDealRelations
  })

  if (!deal) {
    throw new Error('ไม่พบดีลนี้')
  }

  return deal
}

type ApplyTransitionOptions = {
  event: EscrowEvent
  actorId?: string | null
  metadata?: Record<string, unknown>
  updates?: Prisma.DealUpdateInput
}

export const applyEscrowTransition = async (
  prisma: PrismaClient,
  dealId: string,
  options: ApplyTransitionOptions
) => {
  return prisma.$transaction(async (tx) => {
    const deal = await loadDeal(tx, dealId)

    const context = buildContext(deal)

    let nextStatus: EscrowState

    try {
      nextStatus = transitionEscrowState(deal.status, options.event, context)
    } catch (error) {
      if (error instanceof EscrowTransitionError) {
        throw new Error(error.message)
      }
      throw error
    }

    const updates: Prisma.DealUpdateInput = {
      status: nextStatus,
      ...options.updates
    }

    if (
      options.event.type === 'SELLER_SHIPPED' &&
      options.event.deliveredAt &&
      !updates.autoReleaseAt
    ) {
      updates.deliveredAt = options.event.deliveredAt
      updates.autoReleaseAt = computeAutoReleaseAt(
        options.event.deliveredAt,
        env.AUTO_RELEASE_HOURS
      )
    }

    const updatedDeal = await tx.deal.update({
      where: { id: dealId },
      data: updates,
      include: includeDealRelations
    })

    await tx.dealEvent.create({
      data: {
        dealId,
        fromStatus: deal.status,
        toStatus: updatedDeal.status,
        actorId: options.actorId ?? null,
        metadata: options.metadata ?? {}
      }
    })

    return updatedDeal
  })
}
