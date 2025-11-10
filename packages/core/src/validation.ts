import { z } from 'zod';

export const dealCreationSchema = z.object({
  title: z.string().min(3),
  amountTHB: z.number().positive(),
  buyerEmail: z.string().email().optional(),
  note: z.string().max(500).optional()
});

export type DealCreationInput = z.infer<typeof dealCreationSchema>;
