import { describe, it, expect } from 'vitest';
import {
  transitionEscrowState,
  DealStatus,
} from '../src/state/escrowMachine';

describe('escrow state machine', () => {
  const contextBase = {
    hasPayment: true,
    hasTracking: true,
    autoReleaseHours: 48,
  } as const;

  it('transitions from PENDING to HOLD when payment paid', () => {
    const result = transitionEscrowState(
      'PENDING',
      { type: 'PAYMENT_PAID' },
      {
        ...contextBase,
        hasTracking: false,
      }
    );
    expect(result.to).toBe('HOLD');
  });

  it('prevents auto release before window elapsed', () => {
    expect(() =>
      transitionEscrowState(
        'SHIPPED',
        { type: 'AUTO_RELEASE_CHECK' },
        {
          ...contextBase,
          deliveredAt: new Date(),
          now: new Date(Date.now() + 10 * 60 * 1000),
        }
      )
    ).toThrowError(/Auto release not yet eligible/);
  });

  it('allows admin force release from dispute', () => {
    const result = transitionEscrowState(
      'DISPUTE',
      { type: 'ADMIN_FORCE_RELEASE' },
      {
        ...contextBase,
      }
    );
    expect(result.to).toBe('RELEASED');
  });
});
