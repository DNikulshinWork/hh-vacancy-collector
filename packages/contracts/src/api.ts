import { z } from 'zod';

// Vacancy endpoints
export const getVacanciesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'publishedAt', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  location: z.string().optional(),
  experience: z.string().optional(),
});

export type GetVacanciesQuery = z.infer<typeof getVacanciesQuerySchema>;

export const createVacancyBodySchema = z.object({
  hhId: z.string(),
  title: z.string(),
  company: z.string(),
  salaryMin: z.number().nullable(),
  salaryMax: z.number().nullable(),
  currency: z.string().nullable(),
  location: z.string(),
  experience: z.string(),
  description: z.string(),
  url: z.string().url(),
  publishedAt: z.date(),
  rawPayload: z.any(),
});

export type CreateVacancyBody = z.infer<typeof createVacancyBodySchema>;

// FilterConfig endpoints
export const createFilterConfigBodySchema = z.object({
  name: z.string(),
  query: z.string(),
  location: z.string().nullable().optional(),
  experience: z.string().nullable().optional(),
  salaryMin: z.number().nullable().optional(),
  salaryMax: z.number().nullable().optional(),
  active: z.boolean().default(true),
});

export type CreateFilterConfigBody = z.infer<typeof createFilterConfigBodySchema>;

export const updateFilterConfigBodySchema = z.object({
  name: z.string().optional(),
  query: z.string().optional(),
  location: z.string().nullable().optional(),
  experience: z.string().nullable().optional(),
  salaryMin: z.number().nullable().optional(),
  salaryMax: z.number().nullable().optional(),
  active: z.boolean().optional(),
});

export type UpdateFilterConfigBody = z.infer<typeof updateFilterConfigBodySchema>;

// ScrapeRun endpoints
export const createScrapeRunBodySchema = z.object({
  filterConfigId: z.string().uuid(),
  scraperConfigId: z.string().uuid(),
});

export type CreateScrapeRunBody = z.infer<typeof createScrapeRunBodySchema>;