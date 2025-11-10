import { z } from 'zod'

export const lineCallbackSchema = z.object({
  code: z.string().min(5),
  state: z.string().min(5)
})

export const emailOtpRequestSchema = z.object({
  email: z.string().email()
})

export const emailOtpVerifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'OTP ต้องมี 6 หลัก')
})

export const magicLinkPayloadSchema = z.object({
  email: z.string().email(),
  token: z.string().min(10),
  expiresAt: z.number().int()
})
