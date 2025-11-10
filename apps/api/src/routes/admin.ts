import type { FastifyInstance } from 'fastify'
import {
  adminDealFilterSchema,
  adminDisputeFilterSchema
} from '@escrow/core'
import { z } from 'zod'

import { applyEscrowTransition } from '../services/dealService'
import { enqueueReputationRecalc } from '../jobs/queue'

const dealIdParam = z.object({
  id: z.string()
})

export const registerAdminRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/deals', {
    preHandler: fastify.authorize(['admin']),
    schema: {
      querystring: adminDealFilterSchema
    },
    handler: async (request) => {
      const query = request.query as typeof adminDealFilterSchema._type

      const deals = await fastify.prisma.deal.findMany({
        where: {
          status: query.status,
          sellerId: query.sellerId,
          buyerId: query.buyerId
        },
        include: {
          seller: {
            select: {
              displayName: true,
              sellerProfile: true
            }
          },
          buyer: {
            select: {
              displayName: true
            }
          },
          payments: true,
          dispute: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50
      })

      return { deals }
    }
  })

  fastify.get('/disputes', {
    preHandler: fastify.authorize(['admin']),
    schema: {
      querystring: adminDisputeFilterSchema
    },
    handler: async (request) => {
      const query = request.query as typeof adminDisputeFilterSchema._type

      const disputes = await fastify.prisma.dispute.findMany({
        where: {
          status: query.status
        },
        include: {
          deal: {
            include: {
              seller: {
                select: { displayName: true, sellerProfile: true }
              },
              buyer: {
                select: { displayName: true }
              }
            }
          },
          openedBy: {
            select: {
              displayName: true,
              email: true
            }
          },
          evidences: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50
      })

      return { disputes }
    }
  })

  fastify.post('/deals/:id/release', {
    preHandler: fastify.authorize(['admin']),
    schema: { params: dealIdParam },
    handler: async (request, reply) => {
      const { id } = request.params as typeof dealIdParam._type

      const deal = await fastify.prisma.deal.findUnique({
        where: { id },
        include: {
          payments: true,
          seller: {
            include: { sellerProfile: true }
          }
        }
      })

      if (!deal) {
        return reply.notFound('ไม่พบดีลนี้')
      }

      await applyEscrowTransition(fastify.prisma, id, {
        actorId: request.user.id,
        event: { type: 'ADMIN_RESOLVE_RELEASE' },
        metadata: { reason: 'Admin forced release' }
      })

      await fastify.prisma.payment.updateMany({
        where: { dealId: id, status: 'PAID' },
        data: { status: 'PAID' }
      })

      if (deal.seller?.sellerProfile) {
        await enqueueReputationRecalc(deal.seller.sellerProfile.id)
      }

      return { message: 'ปล่อยเงินให้ผู้ขายแล้ว', dealId: id }
    }
  })
}
