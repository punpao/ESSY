import type { FastifyInstance } from 'fastify'
import {
  mockPromptPayWebhookSchema,
  refundPaymentSchema
} from '@escrow/core'
import { z } from 'zod'

import { getPaymentProvider } from '../services/paymentService'
import { applyEscrowTransition } from '../services/dealService'

const createPaymentSchema = z.object({
  paylinkToken: z.string(),
  buyerId: z.string().optional()
})

export const registerPaymentRoutes = async (fastify: FastifyInstance) => {
  fastify.post('/payments/create', {
    schema: {
      body: createPaymentSchema
    },
    handler: async (request, reply) => {
      const { paylinkToken } = request.body as typeof createPaymentSchema._type
      const deal = await fastify.prisma.deal.findUnique({
        where: { paylinkToken },
        include: {
          payments: true,
          seller: {
            include: {
              sellerProfile: true
            }
          }
        }
      })
      if (!deal) {
        return reply.notFound('ไม่พบดีลนี้')
      }
      if (deal.expiresAt < new Date()) {
        return reply.badRequest('ลิงก์นี้หมดอายุแล้ว')
      }

      const payment = deal.payments[0]
      if (!payment) {
        return reply.internalServerError('ไม่พบข้อมูลการชำระเงิน')
      }
      const provider = getPaymentProvider('mock_promptpay')

      const charge = await provider.createCharge({
        dealId: deal.id,
        paylinkToken: deal.paylinkToken,
        title: deal.title,
        amountSatang: deal.amountSatang,
        currency: 'THB',
        sellerPromptPayId: deal.seller.sellerProfile?.promptpayId ?? '',
        sellerPromptPayName: deal.seller.sellerProfile?.promptpayName ?? ''
      })

      await fastify.prisma.payment.update({
        where: { id: payment.id },
        data: {
          providerRef: charge.providerRef,
          status: 'INIT'
        }
      })

      return {
        qrString: charge.qrString,
        providerRef: charge.providerRef,
        copy: 'เงินยังไม่เข้าผู้ขาย จนกว่าคุณจะกดยืนยันรับของ หรือระบบเห็นว่าจัดส่งสำเร็จ'
      }
    }
  })

  fastify.post('/payments/webhook/mock', {
    schema: {
      body: mockPromptPayWebhookSchema
    },
    handler: async (request) => {
      const payload = request.body as typeof mockPromptPayWebhookSchema._type
      const provider = getPaymentProvider('mock_promptpay')

      const result = await provider.handleWebhook(payload)

      const payment = await fastify.prisma.payment.findFirst({
        where: {
          dealId: payload.deal_id,
          providerRef: result.providerRef
        }
      })

      if (!payment) {
        throw new Error('ไม่พบรายการชำระเงินนี้')
      }

      if (result.status === 'PAID') {
        await fastify.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'PAID',
            paidAt: result.paidAt
          }
        })

        await fastify.prisma.deal.update({
          where: { id: payment.dealId },
          data: {
            buyerId: result.buyerId ?? undefined
          }
        })

        await applyEscrowTransition(fastify.prisma, payment.dealId, {
          actorId: result.buyerId,
          event: { type: 'PAYMENT_HELD' },
          metadata: {
            provider: 'mock_promptpay',
            ref: result.providerRef
          }
        })
      } else if (result.status === 'FAILED') {
        await fastify.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED'
          }
        })
      }

      return { ok: true }
    }
  })

  fastify.post('/payments/:dealId/refund', {
    preHandler: fastify.authorize(['admin']),
    schema: {
      params: z.object({ dealId: z.string() }),
      body: refundPaymentSchema
    },
    handler: async (request, reply) => {
      const { dealId } = request.params as { dealId: string }

      const payment = await fastify.prisma.payment.findFirst({
        where: { dealId, status: 'PAID' }
      })

      if (!payment) {
        return reply.notFound('ไม่พบการชำระที่ต้องคืนเงิน')
      }

      const provider = getPaymentProvider('mock_promptpay')
      await provider.refund(payment.providerRef)

      await fastify.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REFUNDED',
          updatedAt: new Date()
        }
      })

      await applyEscrowTransition(fastify.prisma, dealId, {
        actorId: request.user.id,
        event: { type: 'ADMIN_RESOLVE_REFUND', note: 'Admin forced refund' },
        metadata: {
          reason: 'Admin refund',
          note: (request.body as { note?: string }).note
        }
      })

      return {
        message: 'คืนเงินให้ผู้ซื้อแล้ว',
        dealId
      }
    }
  })
}
