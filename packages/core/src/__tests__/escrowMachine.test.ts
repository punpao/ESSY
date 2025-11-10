import { describe, it, expect } from 'vitest';
import { EscrowStateMachine, EscrowContext } from '../state/escrowMachine';

describe('EscrowStateMachine', () => {
  const machine = new EscrowStateMachine();

  it('should transition from PENDING to HOLD when payment received', () => {
    const context: EscrowContext = {
      status: 'PENDING',
      buyer_id: 'buyer123',
    };

    expect(machine.canTransition(context, 'payment_received')).toBe(true);
    const newStatus = machine.transition(context, 'payment_received');
    expect(newStatus).toBe('HOLD');
  });

  it('should not allow payment_received without buyer_id', () => {
    const context: EscrowContext = {
      status: 'PENDING',
    };

    expect(machine.canTransition(context, 'payment_received')).toBe(false);
  });

  it('should transition from HOLD to SHIPPED when tracking added', () => {
    const context: EscrowContext = {
      status: 'HOLD',
      tracking_number: 'TH123456789',
    };

    expect(machine.canTransition(context, 'add_tracking')).toBe(true);
    const newStatus = machine.transition(context, 'add_tracking');
    expect(newStatus).toBe('SHIPPED');
  });

  it('should transition from SHIPPED to RELEASED on confirm', () => {
    const context: EscrowContext = {
      status: 'SHIPPED',
    };

    expect(machine.canTransition(context, 'confirm_received')).toBe(true);
    const newStatus = machine.transition(context, 'confirm_received');
    expect(newStatus).toBe('RELEASED');
  });

  it('should auto-release after timeout if no dispute', () => {
    const pastDate = new Date(Date.now() - 1000);
    const context: EscrowContext = {
      status: 'SHIPPED',
      auto_release_at: pastDate,
      has_open_dispute: false,
    };

    expect(machine.canTransition(context, 'auto_release')).toBe(true);
    expect(machine.shouldAutoRelease(context)).toBe(true);
  });

  it('should not auto-release if dispute is open', () => {
    const pastDate = new Date(Date.now() - 1000);
    const context: EscrowContext = {
      status: 'SHIPPED',
      auto_release_at: pastDate,
      has_open_dispute: true,
    };

    expect(machine.canTransition(context, 'auto_release')).toBe(false);
  });

  it('should transition from HOLD to DISPUTE', () => {
    const context: EscrowContext = {
      status: 'HOLD',
    };

    expect(machine.canTransition(context, 'open_dispute')).toBe(true);
    const newStatus = machine.transition(context, 'open_dispute');
    expect(newStatus).toBe('DISPUTE');
  });

  it('should resolve dispute with REFUND', () => {
    const context: EscrowContext = {
      status: 'DISPUTE',
    };

    expect(machine.canTransition(context, 'resolve_refund')).toBe(true);
    const newStatus = machine.transition(context, 'resolve_refund');
    expect(newStatus).toBe('REFUND');
  });

  it('should resolve dispute with RELEASE', () => {
    const context: EscrowContext = {
      status: 'DISPUTE',
    };

    expect(machine.canTransition(context, 'resolve_release')).toBe(true);
    const newStatus = machine.transition(context, 'resolve_release');
    expect(newStatus).toBe('RELEASED');
  });

  it('should throw error on invalid transition', () => {
    const context: EscrowContext = {
      status: 'RELEASED',
    };

    expect(() => machine.transition(context, 'payment_received')).toThrow();
  });
});
