import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().uuid()
});

export const ulidParamSchema = z.object({
  id: z
    .string()
    .regex(/^[0-9A-HJKMNP-TV-Z]{26}$/i, "Invalid ULID")
});

export const paylinkTokenSchema = z.object({
  paylink_token: z.string().min(16)
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});
