import type { FastifyInstance } from 'fastify'
import { createDealSchema, shipDealSchema } from '@escrow/core'
import { z } from 'zod'
import { ulid } from 'ulid'

import { env } from '../env'
import { thbToSatang } from '../utils/money'
import { applyEscrowTransition, loadDeal } from '../services/dealService'
import { enqueueReputationRecalc } from '../jobs/queue'

const dealIdParam = z.object({
  id: z.string()
})

const paylinkParam = z.object({
  token: z.string()
})

export const registerDealRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/paylinks/:token', {
    schema: {
      params: paylinkParam
    },
    handler: async (request, reply) => {
      const { token } = request.params as typeof paylinkParam._type
      const deal = await fastify.prisma.deal.findUnique({
        where: { paylinkToken: token },
        include: {
          seller: {
            select: {
              displayName: true,
              sellerProfile: {
                select: {
                  promptpayName: true,
                  verified: true,
                  reputationScore: true
                }
              }
            }
          },
          payments: true
        }
      })
      if (!deal) {
        return reply.notFound('ไม่พบ Paylink นี้')
      }

      return {
        id: deal.id,
        title: deal.title,
        amountSatang: deal.amountSatang,
        status: deal.status,
        seller: deal.seller,
        expiresAt: deal.expiresAt,
        buyerNote: deal.buyerNote,
        canPay: deal.status === 'PENDING' && deal.expiresAt > new Date()
      }
    }
  })

  fastify.post('/deals', {
    preHandler: fastify.authorize(['seller']),
    schema: {
      body: createDealSchema
    },
    handler: async (request) => {
      const body = request.body as typeof createDealSchema._type
      const amountSatang = thbToSatang(body.amountTHB)
      const paylinkToken = ulid().toLowerCase()
      const dealId = ulid()

      const deal = await fastify.prisma.deal.create({
        data: {
          id: dealId,
          title: body.title,
          amountSatang,
          currency: 'THB',
          sellerId: request.user.id,
          status: 'PENDING',
          paylinkToken,
          expiresAt: new Date(
            Date.now() + (body.expiresInMinutes ?? 120) * 60 * 1000
          ),
          buyerNote: body.buyerNote,
          payments: {
            create: {
              id: ulid(),
              provider: 'mock_promptpay',
              providerRef: `init_${dealId}`,
              status: 'INIT'
            }
          }
        },
        include: {
          payments: true
        }
      })

      const paylinkUrl = `${env.APP_BASE_URL}/pay/${paylinkToken}`

      return {
        deal,
        paylinkUrl,
        message: 'สร้าง Paylink สำเร็จ ส่งให้ผู้ซื้อในแชทได้เลย'
      }
    }
  })

  fastify.get('/deals/:id', {
    preHandler: fastify.authorize(['buyer', 'seller', 'admin']),
    schema: {
      params: dealIdParam
    },
    handler: async (request, reply) => {
      const { id } = request.params as typeof dealIdParam._type
      const deal = await fastify.prisma.deal.findUnique({
        where: { id },
        include: {
          payments: true,
          seller: {
            include: {
              sellerProfile: true
            }
          },
          buyer: true,
          dispute: {
            include: {
              evidences: true
            }
          },
          events: {
            orderBy: { createdAt: 'desc' }
          }
        }
      })
      if (!deal) {
        return reply.notFound('ไม่พบดีลนี้')
      }
      if (
        request.user.role !== 'admin' &&
        request.user.id !== deal.sellerId &&
        request.user.id !== deal.buyerId
      ) {
        return reply.forbidden('เข้าถึงดีลนี้ไม่ได้')
      }

      return deal
    }
  })

  fastify.post('/deals/:id/ship', {
    preHandler: fastify.authorize(['seller', 'admin']),
    schema: {
      params: dealIdParam,
      body: shipDealSchema
    },
    handler: async (request, reply) => {
      const { id } = request.params as typeof dealIdParam._type
      const body = request.body as typeof shipDealSchema._type

      const deal = await loadDeal(fastify.prisma, id)
      if (
        request.user.role !== 'admin' &&
        request.user.id !== deal.sellerId
      ) {
        return reply.forbidden('เฉพาะผู้ขายเท่านั้นที่อัปเดตการจัดส่งได้')
      }

      const deliveredAt = body.deliveredAt ? new Date(body.deliveredAt) : undefined

      const updated = await applyEscrowTransition(fastify.prisma, id, {
        actorId: request.user.id,
        event: {
          type: 'SELLER_SHIPPED',
          trackingNumber: body.trackingNumber,
          courier: body.courier,
          deliveredAt
        },
        metadata: body,
        updates: {
          trackingNumber: body.trackingNumber,
          courier: body.courier,
          deliveredAt: deliveredAt ?? deal.deliveredAt,
          autoReleaseAt: deliveredAt
            ? new Date(
                deliveredAt.getTime() + env.AUTO_RELEASE_HOURS * 60 * 60 * 1000
              )
            : deal.autoReleaseAt
        }
      })

      return {
        message: 'อัปเดตการจัดส่งแล้ว',
        deal: updated
      }
    }
  })

  fastify.post('/deals/:id/confirm', {
    preHandler: fastify.authorize(['buyer']),
    schema: {
      params: dealIdParam
    },
    handler: async (request, reply) => {
      const { id } = request.params as typeof dealIdParam._type
      const deal = await loadDeal(fastify.prisma, id)
      if (deal.buyerId !== request.user.id) {
        return reply.forbidden('เฉพาะผู้ซื้อเท่านั้นที่ยืนยันรับสินค้าได้')
      }

      const updated = await applyEscrowTransition(fastify.prisma, id, {
        actorId: request.user.id,
        event: { type: 'BUYER_CONFIRMED' },
        metadata: { note: 'Buyer confirmed receipt' }
      })

      await fastify.prisma.payment.updateMany({
        where: { dealId: id, status: { in: ['PAID'] } },
        data: { status: 'PAID' }
      })

      const sellerProfile = await fastify.prisma.sellerProfile.findUnique({
        where: { userId: deal.sellerId }
      })
      if (sellerProfile) {
        await enqueueReputationRecalc(sellerProfile.id)
      }

      return {
        message: 'ยืนยันรับของแล้ว เงินจะถูกโอนให้ผู้ขาย',
        deal: updated
      }
    }
  })

  fastify.post('/deals/:id/cancel', {
    preHandler: fastify.authorize(['seller', 'admin']),
    schema: {
      params: dealIdParam
    },
    handler: async (request, reply) => {
      const { id } = request.params as typeof dealIdParam._type
      const deal = await loadDeal(fastify.prisma, id)
      if (deal.status !== 'PENDING') {
        return reply.badRequest('ยกเลิกได้เฉพาะดีลที่ยังไม่ชำระเท่านั้น')
      }
      const hasPaid = deal.payments.some((payment) => payment.status === 'PAID')
      if (hasPaid) {
        return reply.badRequest('ชำระเงินแล้ว ไม่สามารถยกเลิกได้')
      }
      if (
        request.user.role !== 'admin' &&
        request.user.id !== deal.sellerId
      ) {
        return reply.forbidden('เฉพาะผู้ขายเท่านั้นที่ยกเลิกดีลได้')
      }

      const updated = await applyEscrowTransition(fastify.prisma, id, {
        actorId: request.user.id,
        event: { type: 'SELLER_CANCELLED' },
        metadata: { note: 'Seller cancelled before payment' },
        updates: {
          status: 'REFUND'
        }
      })

      await fastify.prisma.payment.updateMany({
        where: { dealId: id },
        data: { status: 'REFUNDED' }
      })

      return {
        message: 'ยกเลิกดีลแล้ว',
        deal: updated
      }
    }
  })
}
