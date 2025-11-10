import Fastify from 'fastify'
import cors from '@fastify/cors'
import formBody from '@fastify/formbody'
import multipart from '@fastify/multipart'
import sensible from '@fastify/sensible'

import { env } from './env'
import { prismaPlugin } from './plugins/prisma'
import { authPlugin } from './plugins/auth'
import { registerAuthRoutes } from './routes/auth'
import { registerSellerRoutes } from './routes/seller'
import { registerDealRoutes } from './routes/deals'
import { registerPaymentRoutes } from './routes/payments'
import { registerDisputeRoutes } from './routes/disputes'
import { registerAdminRoutes } from './routes/admin'
import { registerBuyerRoutes } from './routes/buyer'

export const buildServer = () => {
  const app = Fastify({
    logger: {
      transport:
        env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss',
                ignore: 'pid,hostname'
              }
            }
          : undefined
    }
  })

  app.setValidatorCompiler(({ schema }) => {
    return (data) => schema.parse(data)
  })

  app.register(cors, { origin: true })
  app.register(formBody)
  app.register(multipart, { attachFieldsToBody: true })
  app.register(sensible)
  app.register(prismaPlugin)
  app.register(authPlugin)

  app.get('/health', async () => ({ ok: true }))

  app.register(registerAuthRoutes, { prefix: '/api/v1/auth' })
  app.register(registerSellerRoutes, { prefix: '/api/v1/seller' })
  app.register(registerBuyerRoutes, { prefix: '/api/v1/buyer' })
  app.register(registerDealRoutes, { prefix: '/api/v1' })
  app.register(registerPaymentRoutes, { prefix: '/api/v1' })
  app.register(registerDisputeRoutes, { prefix: '/api/v1' })
  app.register(registerAdminRoutes, { prefix: '/api/v1/admin' })

  return app
}
