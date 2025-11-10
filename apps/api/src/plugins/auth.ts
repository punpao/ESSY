import fp from 'fastify-plugin'
import jwt from '@fastify/jwt'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { UserRole } from '@prisma/client'

import { env } from '../env'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    authorize: (roles: UserRole[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }

  interface FastifyRequest {
    user: {
      id: string
      role: UserRole
      email?: string
    }
  }
}

export const authPlugin = fp(async (fastify) => {
  await fastify.register(jwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: '12h'
    }
  })

  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify()
      } catch (error) {
        return reply.unauthorized('ต้องเข้าสู่ระบบก่อน')
      }
    }
  )

  fastify.decorate(
    'authorize',
    (roles: UserRole[]) =>
      async (request: FastifyRequest, reply: FastifyReply) => {
        await fastify.authenticate(request, reply)
        if (!roles.includes(request.user.role)) {
          return reply.forbidden('คุณไม่มีสิทธิ์ในส่วนนี้')
        }
      }
  )
})
