import { describe, expect, it } from 'vitest'

import { createDealSchema, openDisputeSchema } from '@escrow/core'

describe('API input validation', () => {
  it('validates create deal payload', () => {
    const parsed = createDealSchema.parse({
      title: 'Vintage Camera',
      amountTHB: 2500,
      buyerNote: 'ขอแพ็คกันกระแทกเยอะๆ',
      expiresInMinutes: 90
    })
    expect(parsed.title).toBe('Vintage Camera')
    expect(parsed.amountTHB).toBe(2500)
  })

  it('rejects short title', () => {
    expect(() =>
      createDealSchema.parse({
        title: 'Hi',
        amountTHB: 100
      })
    ).toThrow()
  })

  it('accepts dispute reasons', () => {
    const result = openDisputeSchema.parse({
      reason: 'not_as_described',
      message: 'ของไม่ตรงตามรูปในโพสต์'
    })
    expect(result.reason).toBe('not_as_described')
  })
})
