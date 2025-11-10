import { describe, it, expect } from 'vitest';
import { dealCreationSchema } from '../src/validation';

describe('deal creation schema', () => {
  it('accepts valid payload', () => {
    const result = dealCreationSchema.parse({
      title: 'กล้องมือสอง',
      amountTHB: 1500,
      buyerEmail: 'buyer@example.com'
    });
    expect(result.title).toBe('กล้องมือสอง');
  });

  it('rejects negative amount', () => {
    expect(() =>
      dealCreationSchema.parse({
        title: 'สินค้า',
        amountTHB: -10
      })
    ).toThrow();
  });
});
