import { z } from 'zod';

export const idSchema = z.string().uuid();

export const isoDateTimeSchema = z.string().datetime();

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.enum(['VALIDATION_ERROR', 'NOT_FOUND', 'CONFLICT', 'INTERNAL_ERROR']),
    message: z.string(),
    details: z
      .array(
        z.object({
          path: z.string(),
          message: z.string(),
        })
      )
      .optional(),
  }),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
