import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { ulid } from 'ulid'

const sellerVerifySchema = z.object({
  promptpayId: z.string().min(8).max(20),
  promptpayName: z.string().min(3).max(60),
  selfieUrl: z.string().url()
})

const sellerApproveSchema = z.object({
  sellerId: z.string(),
  note: z.string().optional()
})

export const registerSellerRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/me', {
    preHandler: fastify.authorize(['seller', 'admin']),
    handler: async (request, reply) => {
      const user = await fastify.prisma.user.findUnique({
        where: { id: request.user.id },
        include: {
          sellerProfile: true
        }
      })
      if (!user) {
        return reply.notFound('ไม่พบผู้ใช้')
      }
      return user
    }
  })

  fastify.post('/verify/basic', {
    preHandler: fastify.authorize(['seller']),
    schema: {
      body: sellerVerifySchema
    },
    handler: async (request, reply) => {
      const body = request.body as typeof sellerVerifySchema._type

      const profile = await fastify.prisma.sellerProfile.upsert({
        where: { userId: request.user.id },
        update: {
          promptpayId: body.promptpayId,
          promptpayName: body.promptpayName,
          kycStatus: 'pending',
          verified: false
        },
        create: {
          id: ulid(),
          userId: request.user.id,
          promptpayId: body.promptpayId,
          promptpayName: body.promptpayName,
          kycStatus: 'pending',
          verified: false
        }
      })

      fastify.log.info(
        { sellerId: request.user.id, selfieUrl: body.selfieUrl },
        'Received seller selfie (mock)'
      )

      return {
        message: 'รับคำขอยืนยันแล้ว กำลังตรวจสอบ (ภายใน 24 ชม.)',
        profile
      }
    }
  })

  fastify.get('/deals', {
    preHandler: fastify.authorize(['seller']),
    handler: async (request) => {
      const deals = await fastify.prisma.deal.findMany({
        where: {
          sellerId: request.user.id
        },
        include: {
          payments: true,
          buyer: {
            select: {
              displayName: true,
              email: true
            }
          },
          dispute: true
        },
        orderBy: { createdAt: 'desc' }
      })

      return { deals }
    }
  })

  fastify.post('/verify/approve', {
    preHandler: fastify.authorize(['admin']),
    schema: {
      body: sellerApproveSchema
    },
    handler: async (request) => {
      const { sellerId } = request.body as typeof sellerApproveSchema._type

      const profile = await fastify.prisma.sellerProfile.update({
        where: { userId: sellerId },
        data: {
          verified: true,
          kycStatus: 'verified'
        }
      })

      await fastify.prisma.user.update({
        where: { id: sellerId },
        data: { kycLevel: 'full' }
      })

      return {
        message: 'ผู้ขายได้รับการยืนยันแล้ว',
        profile
      }
    }
  })
}
