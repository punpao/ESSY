import { describe, it, expect } from 'vitest';
import { transition, isTerminalStatus, canOpenDispute } from './escrowMachine';

describe('Escrow State Machine', () => {
  describe('transition', () => {
    it('should transition from PENDING to HOLD on PAY', () => {
      const result = transition('PENDING', { type: 'PAY' });
      expect(result.valid).toBe(true);
      expect(result.newStatus).toBe('HOLD');
    });

    it('should transition from HOLD to SHIPPED on SHIP', () => {
      const result = transition('HOLD', {
        type: 'SHIP',
        trackingNumber: 'TH123',
        courier: 'Kerry',
      });
      expect(result.valid).toBe(true);
      expect(result.newStatus).toBe('SHIPPED');
    });

    it('should transition from SHIPPED to RELEASED on CONFIRM_RECEIVED', () => {
      const result = transition('SHIPPED', { type: 'CONFIRM_RECEIVED' });
      expect(result.valid).toBe(true);
      expect(result.newStatus).toBe('RELEASED');
    });

    it('should transition from SHIPPED to RELEASED on AUTO_RELEASE', () => {
      const result = transition('SHIPPED', { type: 'AUTO_RELEASE' });
      expect(result.valid).toBe(true);
      expect(result.newStatus).toBe('RELEASED');
    });

    it('should transition from HOLD to DISPUTE on OPEN_DISPUTE', () => {
      const result = transition('HOLD', {
        type: 'OPEN_DISPUTE',
        reason: 'Not received',
      });
      expect(result.valid).toBe(true);
      expect(result.newStatus).toBe('DISPUTE');
    });

    it('should transition from DISPUTE to REFUND on RESOLVE_REFUND', () => {
      const result = transition('DISPUTE', { type: 'RESOLVE_REFUND' });
      expect(result.valid).toBe(true);
      expect(result.newStatus).toBe('REFUND');
    });

    it('should transition from DISPUTE to RELEASED on RESOLVE_RELEASE', () => {
      const result = transition('DISPUTE', { type: 'RESOLVE_RELEASE' });
      expect(result.valid).toBe(true);
      expect(result.newStatus).toBe('RELEASED');
    });

    it('should reject invalid PAY transition from HOLD', () => {
      const result = transition('HOLD', { type: 'PAY' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Cannot PAY');
    });

    it('should reject SHIP from PENDING', () => {
      const result = transition('PENDING', {
        type: 'SHIP',
        trackingNumber: 'TH123',
        courier: 'Kerry',
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('isTerminalStatus', () => {
    it('should return true for RELEASED', () => {
      expect(isTerminalStatus('RELEASED')).toBe(true);
    });

    it('should return true for REFUND', () => {
      expect(isTerminalStatus('REFUND')).toBe(true);
    });

    it('should return false for PENDING', () => {
      expect(isTerminalStatus('PENDING')).toBe(false);
    });
  });

  describe('canOpenDispute', () => {
    it('should allow dispute from HOLD', () => {
      expect(canOpenDispute('HOLD')).toBe(true);
    });

    it('should allow dispute from SHIPPED', () => {
      expect(canOpenDispute('SHIPPED')).toBe(true);
    });

    it('should not allow dispute from PENDING', () => {
      expect(canOpenDispute('PENDING')).toBe(false);
    });

    it('should not allow dispute from RELEASED', () => {
      expect(canOpenDispute('RELEASED')).toBe(false);
    });
  });
});
