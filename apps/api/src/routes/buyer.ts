import type { FastifyInstance } from 'fastify'

export const registerBuyerRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/deals', {
    preHandler: fastify.authorize(['buyer']),
    handler: async (request) => {
      const deals = await fastify.prisma.deal.findMany({
        where: {
          buyerId: request.user.id
        },
        include: {
          seller: {
            select: {
              displayName: true,
              sellerProfile: true
            }
          },
          payments: true,
          dispute: true
        },
        orderBy: { createdAt: 'desc' }
      })

      return { deals }
    }
  })
}
