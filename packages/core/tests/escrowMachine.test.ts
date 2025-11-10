import { describe, expect, it } from 'vitest'

import {
  transitionEscrowState,
  EscrowTransitionError
} from '../src/state/escrowMachine'

const baseContext = {
  hasPayment: true,
  hasDispute: false
} as const

describe('escrow state machine', () => {
  it('moves from PENDING to HOLD when payment captured', () => {
    const next = transitionEscrowState(
      'PENDING',
      { type: 'PAYMENT_HELD' },
      baseContext
    )
    expect(next).toBe('HOLD')
  })

  it('blocks shipping before payment', () => {
    expect(() =>
      transitionEscrowState(
        'PENDING',
        {
          type: 'SELLER_SHIPPED',
          courier: 'Flash',
          trackingNumber: 'TH123'
        },
        { ...baseContext, hasPayment: false }
      )
    ).toThrow(EscrowTransitionError)
  })

  it('allows shipping with tracking info', () => {
    const next = transitionEscrowState(
      'HOLD',
      {
        type: 'SELLER_SHIPPED',
        courier: 'Flash',
        trackingNumber: 'TH123'
      },
      baseContext
    )
    expect(next).toBe('SHIPPED')
  })

  it('auto releases after delivery window', () => {
    const next = transitionEscrowState(
      'SHIPPED',
      { type: 'AUTO_RELEASE' },
      {
        hasPayment: true,
        hasDispute: false,
        autoReleaseAt: new Date(Date.now() - 1000)
      }
    )
    expect(next).toBe('RELEASED')
  })

  it('blocks auto release if dispute open', () => {
    expect(() =>
      transitionEscrowState(
        'SHIPPED',
        { type: 'AUTO_RELEASE' },
        {
          hasPayment: true,
          hasDispute: true,
          autoReleaseAt: new Date(Date.now() - 1000)
        }
      )
    ).toThrow(EscrowTransitionError)
  })

  it('moves to dispute and resolves via refund', () => {
    const disputeState = transitionEscrowState(
      'SHIPPED',
      { type: 'BUYER_OPENED_DISPUTE', reason: 'not_received' },
      baseContext
    )
    expect(disputeState).toBe('DISPUTE')

    const refundState = transitionEscrowState(
      'DISPUTE',
      { type: 'ADMIN_RESOLVE_REFUND' },
      baseContext
    )
    expect(refundState).toBe('REFUND')
  })
})
