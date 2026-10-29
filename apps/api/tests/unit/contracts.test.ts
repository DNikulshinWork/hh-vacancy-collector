import { describe, it, expect } from 'vitest';
import {
  getVacanciesQuerySchema,
  createVacancyBodySchema,
  createFilterConfigBodySchema,
  updateFilterConfigBodySchema,
  createScrapeRunBodySchema,
} from '@repo/contracts';

describe('getVacanciesQuerySchema', () => {
  it('accepts default query', () => {
    const result = getVacanciesQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({ page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' });
    }
  });

  it('rejects limit > 100', () => {
    const result = getVacanciesQuerySchema.safeParse({ limit: 500 });
    expect(result.success).toBe(false);
  });

  it('rejects page < 1', () => {
    const result = getVacanciesQuerySchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });
});

describe('createVacancyBodySchema', () => {
  it('accepts valid body', () => {
    const result = createVacancyBodySchema.safeParse({
      hhId: '12345',
      title: 'Frontend Developer',
      company: 'Company Inc',
      salaryMin: 50000,
      salaryMax: 80000,
      currency: 'RUB',
      location: 'Moscow',
      experience: '1-3 years',
      description: 'Great job opportunity',
      url: 'https://hh.ru/vacancy/12345',
      publishedAt: new Date(),
      rawPayload: {},
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid url', () => {
    const result = createVacancyBodySchema.safeParse({
      hhId: '12345',
      title: 'Frontend Developer',
      company: 'Company Inc',
      salaryMin: null,
      salaryMax: null,
      currency: null,
      location: 'Moscow',
      experience: '1-3 years',
      description: 'Great job opportunity',
      url: 'not-a-url',
      publishedAt: new Date(),
      rawPayload: {},
    });
    expect(result.success).toBe(false);
  });
});

describe('createFilterConfigBodySchema', () => {
  it('accepts valid body and defaults active to true', () => {
    const result = createFilterConfigBodySchema.safeParse({
      name: 'Frontend Moscow',
      query: 'frontend',
      location: 'Moscow',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.active).toBe(true);
    }
  });
});

describe('updateFilterConfigBodySchema', () => {
  it('accepts partial update', () => {
    const result = updateFilterConfigBodySchema.safeParse({
      active: false,
    });
    expect(result.success).toBe(true);
  });
});

describe('createScrapeRunBodySchema', () => {
  it('accepts valid body', () => {
    const result = createScrapeRunBodySchema.safeParse({
      filterConfigId: '00000000-0000-0000-0000-000000000001',
      scraperConfigId: '00000000-0000-0000-0000-000000000002',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-uuid ids', () => {
    const result = createScrapeRunBodySchema.safeParse({
      filterConfigId: 'abc',
      scraperConfigId: 'def',
    });
    expect(result.success).toBe(false);
  });
});