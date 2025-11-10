import { describe, expect, it } from 'vitest';
import { computeAutoReleaseAt, shouldAutoRelease, transitionStatus } from './escrowMachine';

describe('escrowMachine', () => {
  it('transitions PENDING -> HOLD on payment', () => {
    expect(transitionStatus('PENDING', { type: 'PAYMENT_HOLD' })).toBe('HOLD');
  });

  it('rejects invalid transitions', () => {
    expect(() => transitionStatus('PENDING', { type: 'SHIP' })).toThrowError();
  });

  it('auto release after silent period', () => {
    const deliveredAt = new Date('2024-01-01T00:00:00Z');
    const autoReleaseAt = computeAutoReleaseAt(deliveredAt, 48);
    expect(autoReleaseAt.getTime()).toBe(deliveredAt.getTime() + 48 * 60 * 60 * 1000);

    const shouldRelease = shouldAutoRelease({
      deliveredAt,
      buyerConfirmedAt: undefined,
      now: new Date('2024-01-03T01:00:00Z'),
      silentForHours: 48
    });

    expect(shouldRelease).toBe(true);
  });
});
