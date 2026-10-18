import { describe, it, expect } from 'vitest';
import {
  idSchema,
  isoDateTimeSchema,
  paginationQuerySchema,
  apiErrorSchema,
} from '../src/common/index.js';

describe('Common Schemas', () => {
  it('validates correct uuid and rejects non-uuid', () => {
    expect(idSchema.safeParse('123e4567-e89b-12d3-a456-426614174000').success).toBe(true);
    expect(idSchema.safeParse('not-a-uuid').success).toBe(false);
  });

  it('validates iso datetime and rejects invalid dates', () => {
    expect(isoDateTimeSchema.safeParse('2026-10-15T12:34:56.789Z').success).toBe(true);
    expect(isoDateTimeSchema.safeParse('2026-10-15').success).toBe(false);
  });

  it('validates pagination and rejects out of bounds', () => {
    expect(paginationQuerySchema.safeParse({ page: 1, pageSize: 20 }).success).toBe(true);
    expect(paginationQuerySchema.safeParse({ page: 0 }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ pageSize: 101 }).success).toBe(false);
  });

  it('validates api error schema and rejects invalid error codes', () => {
    expect(
      apiErrorSchema.safeParse({
        error: { code: 'NOT_FOUND', message: 'Resource not found' },
      }).success
    ).toBe(true);
    expect(
      apiErrorSchema.safeParse({
        error: { code: 'UNKNOWN_CODE', message: 'Bad' },
      }).success
    ).toBe(false);
  });
});
