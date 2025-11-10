import { describe, expect, it } from 'vitest';
import { createDealSchema } from '../src/routes/modules/deals';

describe('createDealSchema', () => {
  it('rejects invalid payload', () => {
    const result = createDealSchema.safeParse({ title: 'x', amountThb: -5 });
    expect(result.success).toBe(false);
  });

  it('accepts valid payload', () => {
    const result = createDealSchema.safeParse({ title: 'รองเท้า', amountThb: 1990 });
    expect(result.success).toBe(true);
  });
});
