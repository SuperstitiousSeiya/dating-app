import { z } from "zod";

export const CursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const OffsetPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CursorPaginationDto = z.infer<typeof CursorPaginationSchema>;
export type OffsetPaginationDto = z.infer<typeof OffsetPaginationSchema>;
