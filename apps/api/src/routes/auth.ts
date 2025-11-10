import type { FastifyInstance } from 'fastify'
import { emailOtpRequestSchema, emailOtpVerifySchema, lineCallbackSchema } from '@escrow/core'
import { ulid } from 'ulid'

import { createOtpForEmail, verifyEmailOtp } from '../services/otpStore'

const mockLineProfile = (code: string) => ({
  lineSub: `mock-line-${code}`,
  displayName: `LINE ผู้ใช้ ${code.slice(-4)}`,
  email: `line_${code}@escrow.local`
})

export const registerAuthRoutes = async (fastify: FastifyInstance) => {
  fastify.post('/line/callback', {
    schema: {
      body: lineCallbackSchema
    },
    handler: async (request, reply) => {
      const body = request.body as typeof lineCallbackSchema._type
      const profile = mockLineProfile(body.code)

      const user = await fastify.prisma.user.upsert({
        where: { lineSub: profile.lineSub },
        update: {
          displayName: profile.displayName
        },
        create: {
          id: ulid(),
          role: 'buyer',
          email: profile.email,
          displayName: profile.displayName,
          lineSub: profile.lineSub,
          kycLevel: 'basic'
        }
      })

      const token = await reply.jwtSign({
        id: user.id,
        role: user.role,
        email: user.email
      })

      return {
        accessToken: token,
        user
      }
    }
  })

  fastify.post('/email/request', {
    schema: {
      body: emailOtpRequestSchema
    },
    handler: async (request) => {
      const { email } = request.body as typeof emailOtpRequestSchema._type
      const otp = createOtpForEmail(email)
      fastify.log.info({ email, otp }, 'Generated OTP (mock send)')
      return {
        message: 'ส่ง OTP ไปที่อีเมลแล้ว (mock)',
        otp // expose for demo/testing
      }
    }
  })

  fastify.post('/email/verify', {
    schema: {
      body: emailOtpVerifySchema
    },
    handler: async (request, reply) => {
      const { email, otp } = request.body as typeof emailOtpVerifySchema._type
      const valid = verifyEmailOtp(email, otp)
      if (!valid) {
        return reply.badRequest('OTP ไม่ถูกต้องหรือหมดอายุ')
      }

      const user = await fastify.prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          id: ulid(),
          role: 'buyer',
          email,
          displayName: email.split('@')[0],
          kycLevel: 'basic'
        }
      })

      const token = await reply.jwtSign({
        id: user.id,
        role: user.role,
        email: user.email
      })

      return {
        accessToken: token,
        user
      }
    }
  })
}
