import { describe, it, expect } from 'vitest';
import { EscrowStateMachine } from '@essy/core';

describe('EscrowStateMachine', () => {
  it('should allow PENDING → HOLD transition', () => {
    expect(EscrowStateMachine.canTransition('PENDING', 'HOLD')).toBe(true);
  });

  it('should allow HOLD → SHIPPED transition', () => {
    expect(EscrowStateMachine.canTransition('HOLD', 'SHIPPED')).toBe(true);
  });

  it('should allow SHIPPED → RELEASED transition', () => {
    expect(EscrowStateMachine.canTransition('SHIPPED', 'RELEASED')).toBe(true);
  });

  it('should allow HOLD → DISPUTE transition', () => {
    expect(EscrowStateMachine.canTransition('HOLD', 'DISPUTE')).toBe(true);
  });

  it('should allow SHIPPED → DISPUTE transition', () => {
    expect(EscrowStateMachine.canTransition('SHIPPED', 'DISPUTE')).toBe(true);
  });

  it('should allow DISPUTE → REFUND transition', () => {
    expect(EscrowStateMachine.canTransition('DISPUTE', 'REFUND')).toBe(true);
  });

  it('should allow DISPUTE → RELEASED transition', () => {
    expect(EscrowStateMachine.canTransition('DISPUTE', 'RELEASED')).toBe(true);
  });

  it('should reject invalid transitions', () => {
    expect(EscrowStateMachine.canTransition('RELEASED', 'HOLD')).toBe(false);
    expect(EscrowStateMachine.canTransition('REFUND', 'HOLD')).toBe(false);
    expect(EscrowStateMachine.canTransition('PENDING', 'RELEASED')).toBe(false);
  });

  it('should identify terminal states', () => {
    expect(EscrowStateMachine.isTerminal('RELEASED')).toBe(true);
    expect(EscrowStateMachine.isTerminal('REFUND')).toBe(true);
    expect(EscrowStateMachine.isTerminal('HOLD')).toBe(false);
  });

  it('should check if deal can be cancelled', () => {
    expect(EscrowStateMachine.canCancel('PENDING')).toBe(true);
    expect(EscrowStateMachine.canCancel('HOLD')).toBe(false);
  });

  it('should check if dispute can be opened', () => {
    expect(EscrowStateMachine.canOpenDispute('HOLD')).toBe(true);
    expect(EscrowStateMachine.canOpenDispute('SHIPPED')).toBe(true);
    expect(EscrowStateMachine.canOpenDispute('PENDING')).toBe(false);
  });
});
