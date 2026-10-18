import { describe, it, expect } from 'vitest';
import {
  filterConfigUpdateSchema,
  filterConfigSchema,
  filterListResponseSchema,
} from '../src/filter/index.js';

describe('FilterConfig Schemas', () => {
  const validUpdate = {
    name: 'default',
    titleKeywordsInclude: ['fullstack', 'разработчик'],
    descriptionKeywordsInclude: ['TypeScript', 'React'],
    titleKeywordsExclude: ['1С', 'QA'],
    descriptionKeywordsExclude: [],
    employment: ['full', 'part', 'project'] as const,
    schedule: ['remote'] as const,
    experience: [] as const,
    area: [1],
    searchPeriodDays: 7,
    orderBy: 'publication_time' as const,
  };

  it('validates valid FilterConfigUpdate and rejects searchPeriodDays > 30', () => {
    expect(filterConfigUpdateSchema.safeParse(validUpdate).success).toBe(true);
    expect(
      filterConfigUpdateSchema.safeParse({ ...validUpdate, searchPeriodDays: 31 }).success
    ).toBe(false);
    expect(
      filterConfigUpdateSchema.safeParse({ ...validUpdate, searchPeriodDays: 0 }).success
    ).toBe(false);
  });

  it('validates full FilterConfig and rejects missing timestamps', () => {
    const fullConfig = {
      ...validUpdate,
      id: '123e4567-e89b-12d3-a456-426614174000',
      isActive: true,
      createdAt: '2026-10-15T12:00:00.000Z',
      updatedAt: '2026-10-15T12:00:00.000Z',
    };
    expect(filterConfigSchema.safeParse(fullConfig).success).toBe(true);
    expect(filterConfigSchema.safeParse({ ...fullConfig, createdAt: undefined }).success).toBe(false);
  });

  it('validates FilterListResponse and rejects non-uuid activeId', () => {
    const fullConfig = {
      ...validUpdate,
      id: '123e4567-e89b-12d3-a456-426614174000',
      isActive: true,
      createdAt: '2026-10-15T12:00:00.000Z',
      updatedAt: '2026-10-15T12:00:00.000Z',
    };
    expect(
      filterListResponseSchema.safeParse({
        items: [fullConfig],
        activeId: fullConfig.id,
      }).success
    ).toBe(true);
    expect(
      filterListResponseSchema.safeParse({
        items: [],
        activeId: 'invalid-id',
      }).success
    ).toBe(false);
  });
});
