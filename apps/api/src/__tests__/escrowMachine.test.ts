import { describe, it, expect } from 'vitest';
import { EscrowStateMachine } from '@essy/core';

describe('EscrowStateMachine', () => {
  it('should allow PENDING -> HOLD transition with payment', () => {
    expect(
      EscrowStateMachine.canTransition('PENDING', 'HOLD', { hasPayment: true })
    ).toBe(true);
  });

  it('should not allow PENDING -> SHIPPED transition', () => {
    expect(EscrowStateMachine.canTransition('PENDING', 'SHIPPED')).toBe(false);
  });

  it('should allow HOLD -> SHIPPED with tracking', () => {
    expect(
      EscrowStateMachine.canTransition('HOLD', 'SHIPPED', { hasTracking: true })
    ).toBe(true);
  });

  it('should allow SHIPPED -> RELEASED', () => {
    expect(EscrowStateMachine.canTransition('SHIPPED', 'RELEASED')).toBe(true);
  });

  it('should allow HOLD -> DISPUTE', () => {
    expect(EscrowStateMachine.canTransition('HOLD', 'DISPUTE')).toBe(true);
  });

  it('should allow DISPUTE -> REFUND', () => {
    expect(EscrowStateMachine.canTransition('DISPUTE', 'REFUND')).toBe(true);
  });

  it('should identify terminal states', () => {
    expect(EscrowStateMachine.isTerminal('RELEASED')).toBe(true);
    expect(EscrowStateMachine.isTerminal('REFUND')).toBe(true);
    expect(EscrowStateMachine.isTerminal('PENDING')).toBe(false);
  });

  it('should check auto-release conditions', () => {
    const deliveredAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    const autoReleaseAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

    expect(
      EscrowStateMachine.canAutoRelease('SHIPPED', deliveredAt, autoReleaseAt, false)
    ).toBe(true);

    expect(
      EscrowStateMachine.canAutoRelease('SHIPPED', deliveredAt, autoReleaseAt, true)
    ).toBe(false); // Has open dispute

    expect(
      EscrowStateMachine.canAutoRelease('HOLD', deliveredAt, autoReleaseAt, false)
    ).toBe(false); // Wrong status
  });
});
