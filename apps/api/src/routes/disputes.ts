import type { FastifyInstance } from 'fastify'
import {
  disputeEvidenceSchema,
  openDisputeSchema,
  resolveDisputeSchema
} from '@escrow/core'
import { z } from 'zod'
import { ulid } from 'ulid'

import { applyEscrowTransition, loadDeal } from '../services/dealService'
import { enqueueReputationRecalc } from '../jobs/queue'
import { getPaymentProvider } from '../services/paymentService'

const dealIdParam = z.object({
  dealId: z.string()
})

const disputeIdParam = z.object({
  id: z.string()
})

export const registerDisputeRoutes = async (fastify: FastifyInstance) => {
  fastify.post('/disputes/:dealId/open', {
    preHandler: fastify.authorize(['buyer']),
    schema: {
      params: dealIdParam,
      body: openDisputeSchema
    },
    handler: async (request, reply) => {
      const { dealId } = request.params as typeof dealIdParam._type
      const body = request.body as typeof openDisputeSchema._type

      const deal = await loadDeal(fastify.prisma, dealId)
      if (deal.buyerId !== request.user.id) {
        return reply.forbidden('เฉพาะผู้ซื้อเท่านั้นที่เปิดข้อพิพาทได้')
      }
      if (!['SHIPPED', 'HOLD'].includes(deal.status)) {
        return reply.badRequest('เปิดข้อพิพาทได้หลังผู้ขายส่งของเท่านั้น')
      }
      if (deal.dispute) {
        return reply.badRequest('ดีลนี้มีข้อพิพาทอยู่แล้ว')
      }

      await applyEscrowTransition(fastify.prisma, dealId, {
        actorId: request.user.id,
        event: { type: 'BUYER_OPENED_DISPUTE', reason: body.reason },
        metadata: { reason: body.reason, message: body.message }
      })

      const dispute = await fastify.prisma.dispute.create({
        data: {
          id: ulid(),
          dealId,
          openedById: request.user.id,
          reasonText: body.message,
          status: 'OPEN'
        }
      })

      return {
        message: 'เปิดข้อพิพาทแล้ว ทีมงานจะติดต่อกลับภายใน 24 ชม.',
        dispute
      }
    }
  })

  fastify.post('/disputes/:id/evidence', {
    preHandler: fastify.authorize(['buyer', 'admin']),
    schema: {
      params: disputeIdParam,
      body: disputeEvidenceSchema
    },
    handler: async (request, reply) => {
      const { id } = request.params as typeof disputeIdParam._type
      const body = request.body as typeof disputeEvidenceSchema._type

      const dispute = await fastify.prisma.dispute.findUnique({
        where: { id },
        include: { deal: true }
      })
      if (!dispute) {
        return reply.notFound('ไม่พบข้อพิพาทนี้')
      }
      if (
        request.user.role !== 'admin' &&
        dispute.openedById !== request.user.id
      ) {
        return reply.forbidden('คุณไม่มีสิทธิ์อัปโหลดหลักฐานนี้')
      }

      const items = body.items.map((item) => ({
        id: ulid(),
        disputeId: id,
        uploadedById: request.user.id,
        kind: item.kind,
        url: item.url,
        note: item.note
      }))

      await fastify.prisma.evidence.createMany({
        data: items
      })

      return {
        message: 'อัปโหลดหลักฐานแล้ว',
        items
      }
    }
  })

  fastify.post('/disputes/:id/resolve', {
    preHandler: fastify.authorize(['admin']),
    schema: {
      params: disputeIdParam,
      body: resolveDisputeSchema
    },
    handler: async (request, reply) => {
      const { id } = request.params as typeof disputeIdParam._type
      const body = request.body as typeof resolveDisputeSchema._type

      const dispute = await fastify.prisma.dispute.findUnique({
        where: { id },
        include: {
          deal: {
            include: {
              payments: true,
              seller: {
                include: { sellerProfile: true }
              }
            }
          }
        }
      })
      if (!dispute) {
        return reply.notFound('ไม่พบข้อพิพาทนี้')
      }

      if (!dispute.deal) {
        return reply.internalServerError('ข้อพิพาทไม่มีดีลที่เกี่ยวข้อง')
      }

      const dealId = dispute.deal.id

      if (body.resolution === 'RESOLVED_REFUND') {
        const payment = dispute.deal.payments.find((p) => p.status === 'PAID')
        if (payment) {
          const provider = getPaymentProvider('mock_promptpay')
          await provider.refund(payment.providerRef)

          await fastify.prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'REFUNDED' }
          })
        }

        await applyEscrowTransition(fastify.prisma, dealId, {
          actorId: request.user.id,
          event: { type: 'ADMIN_RESOLVE_REFUND', note: body.note },
          metadata: { resolution: 'refund', note: body.note }
        })
      } else {
        await applyEscrowTransition(fastify.prisma, dealId, {
          actorId: request.user.id,
          event: { type: 'ADMIN_RESOLVE_RELEASE', note: body.note },
          metadata: { resolution: 'release', note: body.note }
        })
      }

      await fastify.prisma.dispute.update({
        where: { id },
        data: {
          status: body.resolution,
          resolutionNote: body.note,
          resolvedAt: new Date()
        }
      })

      if (dispute.deal.seller?.sellerProfile) {
        await enqueueReputationRecalc(dispute.deal.seller.sellerProfile.id)
      }

      return {
        message: 'ปิดข้อพิพาทแล้ว',
        disputeId: id,
        resolution: body.resolution
      }
    }
  })
}
