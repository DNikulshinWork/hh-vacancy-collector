import { describe, it, expect } from 'vitest';
import {
  vacancyListItemSchema,
  vacancySchema,
  vacancyListQuerySchema,
  vacancyListResponseSchema,
  patchStatusBodySchema,
} from '../src/vacancy/index.js';

describe('Vacancy Schemas', () => {
  const validListItem = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    hhId: '12345678',
    title: 'TypeScript Developer',
    company: 'Acme Corp',
    url: 'https://hh.ru/vacancy/12345678',
    salaryFrom: 100000,
    salaryTo: 200000,
    currency: 'RUB',
    salaryTax: 'net',
    employment: 'full',
    schedule: 'remote',
    experience: 'between1And3',
    publishedAt: '2026-10-15T12:00:00.000Z',
    status: 'new',
    createdAt: '2026-10-15T12:00:00.000Z',
  };

  it('validates valid VacancyListItem and rejects invalid enum', () => {
    expect(vacancyListItemSchema.safeParse(validListItem).success).toBe(true);
    expect(
      vacancyListItemSchema.safeParse({ ...validListItem, status: 'invalid_status' }).success
    ).toBe(false);
  });

  it('validates full Vacancy with description and rejects missing id', () => {
    const fullVacancy = {
      ...validListItem,
      descriptionMd: '# Job description',
      updatedAt: '2026-10-15T12:00:00.000Z',
    };
    expect(vacancySchema.safeParse(fullVacancy).success).toBe(true);
    expect(vacancySchema.safeParse({ ...fullVacancy, id: 'bad-id' }).success).toBe(false);
  });

  it('validates vacancyListQuerySchema and rejects invalid sort', () => {
    expect(vacancyListQuerySchema.safeParse({ page: '2', pageSize: '50' }).success).toBe(true);
    expect(vacancyListQuerySchema.safeParse({ sort: 'unsupported:sort' }).success).toBe(false);
  });

  it('validates vacancyListResponseSchema and rejects negative total', () => {
    expect(
      vacancyListResponseSchema.safeParse({
        items: [validListItem],
        total: 1,
        page: 1,
        pageSize: 20,
      }).success
    ).toBe(true);
    expect(
      vacancyListResponseSchema.safeParse({
        items: [],
        total: -1,
        page: 1,
        pageSize: 20,
      }).success
    ).toBe(false);
  });

  it('validates patchStatusBodySchema and rejects missing status', () => {
    expect(patchStatusBodySchema.safeParse({ status: 'viewed' }).success).toBe(true);
    expect(patchStatusBodySchema.safeParse({}).success).toBe(false);
  });
});
