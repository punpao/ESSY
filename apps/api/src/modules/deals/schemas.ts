import { z } from "zod";

export const createDealSchema = z.object({
  title: z.string().min(3),
  amount_thb: z.number().positive(),
  buyer_note: z.string().max(500).optional(),
  expires_in_hours: z.number().min(1).max(168).default(24)
});

export const shipDealSchema = z.object({
  tracking_number: z.string().min(5),
  courier: z.string().min(2),
  delivered_at: z.coerce.date().optional()
});

export const confirmSchema = z.object({
  note: z.string().optional()
});

export const cancelSchema = z.object({
  reason: z.string().min(3)
});
