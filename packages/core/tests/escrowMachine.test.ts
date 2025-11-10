import { describe, it, expect } from 'vitest';
import { transitionEscrow } from '../src/state/escrowMachine';

describe('escrow state machine', () => {
  it('moves from pending to hold after payment', () => {
    const result = transitionEscrow({ state: 'PENDING' }, { type: 'PAYMENT_PAID' });
    expect(result.state).toBe('HOLD');
  });

  it('prevents auto release without delivery', () => {
    expect(() =>
      transitionEscrow({ state: 'SHIPPED', context: { delivered: false, hasOpenDispute: false } }, { type: 'AUTO_RELEASE' })
    ).toThrow();
  });

  it('allows auto release when delivered', () => {
    const result = transitionEscrow(
      { state: 'SHIPPED', context: { delivered: true, hasOpenDispute: false } },
      { type: 'AUTO_RELEASE' }
    );
    expect(result.state).toBe('RELEASED');
  });

  it('blocks release when dispute open', () => {
    expect(() =>
      transitionEscrow(
        { state: 'SHIPPED', context: { delivered: true, hasOpenDispute: true } },
        { type: 'AUTO_RELEASE' }
      )
    ).toThrow();
  });

  it('allows admin force release from hold', () => {
    const result = transitionEscrow({ state: 'HOLD' }, { type: 'ADMIN_RELEASE' });
    expect(result.state).toBe('RELEASED');
  });
});
