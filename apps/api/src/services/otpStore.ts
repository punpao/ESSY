type OtpEntry = {
  otp: string
  expiresAt: number
}

const otpStore = new Map<string, OtpEntry>()

const OTP_TTL_MS = 10 * 60 * 1000

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString()

export const createOtpForEmail = (email: string) => {
  const otp = generateOtp()
  otpStore.set(email.toLowerCase(), {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS
  })
  return otp
}

export const verifyEmailOtp = (email: string, otp: string) => {
  const entry = otpStore.get(email.toLowerCase())
  if (!entry) {
    return false
  }
  if (entry.expiresAt < Date.now()) {
    otpStore.delete(email.toLowerCase())
    return false
  }
  const isValid = entry.otp === otp
  if (isValid) {
    otpStore.delete(email.toLowerCase())
  }
  return isValid
}
