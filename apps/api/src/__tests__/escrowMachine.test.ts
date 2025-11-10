import { describe, it, expect } from 'vitest';
import {
  escrowTransition,
  canTransition,
  getValidEvents,
  type EscrowEvent,
  type EscrowContext,
} from '@essy/core';

describe('Escrow State Machine', () => {
  const baseContext: EscrowContext = {
    status: 'PENDING',
    hasPayment: false,
    hasTracking: false,
    isDelivered: false,
    hasOpenDispute: false,
  };

  describe('PENDING state', () => {
    it('should transition to HOLD on PAYMENT_RECEIVED', () => {
      const newStatus = escrowTransition('PENDING', { type: 'PAYMENT_RECEIVED' }, baseContext);
      expect(newStatus).toBe('HOLD');
    });

    it('should allow CANCEL', () => {
      const valid = canTransition('PENDING', { type: 'CANCEL' }, baseContext);
      expect(valid).toBe(true);
    });
  });

  describe('HOLD state', () => {
    const holdContext: EscrowContext = {
      ...baseContext,
      status: 'HOLD',
      hasPayment: true,
    };

    it('should transition to SHIPPED on SHIPPED event', () => {
      const newStatus = escrowTransition(
        'HOLD',
        { type: 'SHIPPED', trackingNumber: 'TH123', courier: 'Kerry' },
        holdContext
      );
      expect(newStatus).toBe('SHIPPED');
    });

    it('should transition to DISPUTE on DISPUTE_OPENED', () => {
      const newStatus = escrowTransition('HOLD', { type: 'DISPUTE_OPENED' }, holdContext);
      expect(newStatus).toBe('DISPUTE');
    });
  });

  describe('SHIPPED state', () => {
    const shippedContext: EscrowContext = {
      ...baseContext,
      status: 'SHIPPED',
      hasPayment: true,
      hasTracking: true,
    };

    it('should transition to RELEASED on BUYER_CONFIRMED', () => {
      const newStatus = escrowTransition('SHIPPED', { type: 'BUYER_CONFIRMED' }, shippedContext);
      expect(newStatus).toBe('RELEASED');
    });

    it('should transition to RELEASED on AUTO_RELEASE', () => {
      const newStatus = escrowTransition('SHIPPED', { type: 'AUTO_RELEASE' }, shippedContext);
      expect(newStatus).toBe('RELEASED');
    });
  });

  describe('DISPUTE state', () => {
    const disputeContext: EscrowContext = {
      ...baseContext,
      status: 'DISPUTE',
      hasOpenDispute: true,
    };

    it('should transition to REFUND on DISPUTE_RESOLVED_REFUND', () => {
      const newStatus = escrowTransition(
        'DISPUTE',
        { type: 'DISPUTE_RESOLVED_REFUND' },
        disputeContext
      );
      expect(newStatus).toBe('REFUND');
    });

    it('should transition to RELEASED on DISPUTE_RESOLVED_RELEASE', () => {
      const newStatus = escrowTransition(
        'DISPUTE',
        { type: 'DISPUTE_RESOLVED_RELEASE' },
        disputeContext
      );
      expect(newStatus).toBe('RELEASED');
    });
  });

  describe('Terminal states', () => {
    it('should not allow transitions from RELEASED', () => {
      const context: EscrowContext = {
        ...baseContext,
        status: 'RELEASED',
      };
      const valid = canTransition('RELEASED', { type: 'PAYMENT_RECEIVED' }, context);
      expect(valid).toBe(false);
    });

    it('should not allow transitions from REFUND', () => {
      const context: EscrowContext = {
        ...baseContext,
        status: 'REFUND',
      };
      const valid = canTransition('REFUND', { type: 'PAYMENT_RECEIVED' }, context);
      expect(valid).toBe(false);
    });
  });
});
