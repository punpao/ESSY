import { describe, it, expect } from 'vitest';
import { createDealSchema } from '@thai-escrow/core';

describe('validation schemas', () => {
  it('validates deal creation', () => {
    const parsed = createDealSchema.parse({
      title: 'Test deal',
      amountThb: 999,
    });
    expect(parsed.currency).toEqual('THB');
  });

  it('rejects invalid amount', () => {
    expect(() =>
      createDealSchema.parse({
        title: 'Tiny',
        amountThb: -1,
      })
    ).toThrow();
  });
});
