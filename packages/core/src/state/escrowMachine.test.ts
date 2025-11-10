import { describe, it, expect } from 'vitest';
import { EscrowStateMachine } from './escrowMachine';

describe('EscrowStateMachine', () => {
  it('should transition PENDING → HOLD when payment received', () => {
    const result = EscrowStateMachine.transition('PENDING', 'PAYMENT_RECEIVED', {
      currentStatus: 'PENDING',
      hasPayment: true,
      hasBuyer: true,
    });
    expect(result).toBe('HOLD');
  });

  it('should not allow PENDING → HOLD without payment', () => {
    expect(() =>
      EscrowStateMachine.transition('PENDING', 'PAYMENT_RECEIVED', {
        currentStatus: 'PENDING',
        hasPayment: false,
      })
    ).toThrow();
  });

  it('should transition HOLD → SHIPPED when tracking added', () => {
    const result = EscrowStateMachine.transition('HOLD', 'ADD_TRACKING', {
      currentStatus: 'HOLD',
      hasTracking: true,
    });
    expect(result).toBe('SHIPPED');
  });

  it('should transition SHIPPED → RELEASED on confirm', () => {
    const result = EscrowStateMachine.transition('SHIPPED', 'CONFIRM_RECEIVED', {
      currentStatus: 'SHIPPED',
    });
    expect(result).toBe('RELEASED');
  });

  it('should transition to DISPUTE from HOLD or SHIPPED', () => {
    const fromHold = EscrowStateMachine.transition('HOLD', 'OPEN_DISPUTE', {
      currentStatus: 'HOLD',
    });
    expect(fromHold).toBe('DISPUTE');

    const fromShipped = EscrowStateMachine.transition('SHIPPED', 'OPEN_DISPUTE', {
      currentStatus: 'SHIPPED',
    });
    expect(fromShipped).toBe('DISPUTE');
  });

  it('should resolve DISPUTE to REFUND (admin only)', () => {
    const result = EscrowStateMachine.transition('DISPUTE', 'RESOLVE_REFUND', {
      currentStatus: 'DISPUTE',
      isAdmin: true,
    });
    expect(result).toBe('REFUND');
  });

  it('should not allow non-admin to resolve dispute', () => {
    expect(() =>
      EscrowStateMachine.transition('DISPUTE', 'RESOLVE_REFUND', {
        currentStatus: 'DISPUTE',
        isAdmin: false,
      })
    ).toThrow();
  });

  it('should identify terminal states', () => {
    expect(EscrowStateMachine.isTerminalState('RELEASED')).toBe(true);
    expect(EscrowStateMachine.isTerminalState('REFUND')).toBe(true);
    expect(EscrowStateMachine.isTerminalState('CANCELLED')).toBe(true);
    expect(EscrowStateMachine.isTerminalState('HOLD')).toBe(false);
  });

  it('should allow auto-release from SHIPPED', () => {
    const result = EscrowStateMachine.transition('SHIPPED', 'AUTO_RELEASE', {
      currentStatus: 'SHIPPED',
      autoReleaseReady: true,
      hasOpenDispute: false,
    });
    expect(result).toBe('RELEASED');
  });

  it('should not auto-release if dispute is open', () => {
    expect(() =>
      EscrowStateMachine.transition('SHIPPED', 'AUTO_RELEASE', {
        currentStatus: 'SHIPPED',
        autoReleaseReady: true,
        hasOpenDispute: true,
      })
    ).toThrow();
  });
});
